import asyncio
import logging
from datetime import datetime, timezone
from app.repositories.repositories import RequestRepo, NotificationRepo
from app.services.matching import MatchingService
from app.services.notification_service import notification_service
from app.services.sms_service import sms_service
from app.models.models import RequestStatus
from app.core.config import settings


logger = logging.getLogger("app.services.scheduler")

_expansion_notified = {}


class RadiusExpansionScheduler:
    def __init__(self):
        self._task = None

    async def expand_open_requests(self):
        await asyncio.sleep(60)
        while True:
            try:
                await self._process_expansion()
            except Exception as e:
                logger.error(f"Radius expansion error: {e}")
            await asyncio.sleep(settings.MATCHING_EXPANSION_INTERVAL_SECONDS)

    async def _process_expansion(self):
        request_repo = RequestRepo()
        open_requests = await request_repo.collection.find(
            {
                "status": {"$in": [RequestStatus.OPEN.value, RequestStatus.MATCHED.value]},
                "current_radius_km": {"$lt": settings.MATCHING_MAX_RADIUS_KM},
            }
        ).to_list(length=100)

        if not open_requests:
            return

        logger.info(f"Checking {len(open_requests)} request(s) for radius expansion")

        for req in open_requests:
            try:
                await self._expand_single_request(req)
            except Exception as e:
                logger.error(f"Error expanding request {req['_id']}: {e}")

    async def _expand_single_request(self, req: dict):
        request_id = str(req["_id"])
        current_radius = req.get("current_radius_km", settings.MATCHING_INITIAL_RADIUS_KM)
        new_radius = current_radius + settings.MATCHING_RADIUS_STEP_KM

        if current_radius >= settings.MATCHING_MAX_RADIUS_KM:
            return

        matching_service = MatchingService()
        new_volunteers = await matching_service.expand_radius(request_id)
        if new_volunteers is None:
            return

        resource = req.get("resource", "")
        urgency = req.get("urgency", "high")
        location_name = req.get("location_name", "unknown location")

        if not new_volunteers:
            expansion_key = f"{request_id}:r{int(new_radius)}"
            if expansion_key not in _expansion_notified:
                _expansion_notified[expansion_key] = True
                logger.info(
                    f"Request {request_id}: no new volunteers, notifying requester of expansion to {new_radius}km"
                )
                try:
                    await sms_service.send_search_expanded(
                        phone=req["requester_phone"],
                        radius_km=new_radius,
                    )
                except Exception as e:
                    logger.warning(f"Failed to send expansion SMS: {e}")
            else:
                logger.info(f"Request {request_id}: already notified about {new_radius}km expansion, skipping SMS")
            return

        notification_repo = NotificationRepo()
        existing = await notification_repo.get_by_request(request_id)
        already_notified_phones = {n.get("volunteer_phone") for n in existing}

        truly_new = [
            v for v in new_volunteers
            if v["phone"] not in already_notified_phones
        ]

        if not truly_new:
            logger.info(f"Request {request_id}: all volunteers already notified, skipping")
            return

        request_coordinates = None
        if req.get("location") and req["location"] is not None:
            request_coordinates = req["location"].get("coordinates")

        await notification_service.notify_volunteers(
            request_id=request_id,
            volunteers=truly_new,
            resource=resource,
            urgency=urgency,
            location_name=location_name,
            request_coordinates=request_coordinates,
        )

        request_repo = RequestRepo()
        await request_repo.update_status(request_id, RequestStatus.MATCHED)

        from app.services.ws_manager import ws_manager
        volunteer_phones = [v["phone"] for v in truly_new]
        updated_req = await request_repo.get_by_id(request_id)
        if updated_req:
            from app.api.v1.requests import request_to_response
            await ws_manager.broadcast_new_request(
                request_data=request_to_response(updated_req).model_dump(mode="json"),
                volunteer_phones=volunteer_phones,
            )

        logger.info(
            f"Request {request_id}: expanded to {new_radius}km, "
            f"notified {len(truly_new)} new volunteers"
        )

    async def start(self):
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self.expand_open_requests())
            logger.info("Radius expansion scheduler started (5min intervals)")

    async def stop(self):
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("Radius expansion scheduler stopped")


scheduler = RadiusExpansionScheduler()