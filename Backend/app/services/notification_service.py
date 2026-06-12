import logging
from app.repositories.repositories import NotificationRepo, AppNotificationRepo
from app.services.sms_service import sms_service
from app.models.models import NotificationStatus, AppNotificationType
from app.services.matching import haversine_km


logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self):
        self.notification_repo = NotificationRepo()
        self.app_notification_repo = AppNotificationRepo()

    async def create_app_notification(
        self,
        user_phone: str,
        notification_type: AppNotificationType,
        title: str,
        message: str,
        request_id: str = None,
        data: dict = None,
    ):
        await self.app_notification_repo.create({
            "user_phone": user_phone,
            "notification_type": notification_type.value,
            "title": title,
            "message": message,
            "request_id": request_id,
            "data": data,
            "read": False,
        })

    async def notify_volunteers(
        self,
        request_id: str,
        volunteers: list,
        resource: str,
        urgency: str,
        location_name: str,
        request_coordinates: list = None,
    ) -> list:
        notifications = []
        for volunteer in volunteers:
            volunteer_phone = volunteer["phone"]
            distance_km = 0.0

            if request_coordinates and volunteer.get("location") and volunteer["location"].get("coordinates"):
                vol_coords = volunteer["location"]["coordinates"]
                distance_km = haversine_km(
                    lat1=request_coordinates[1], lon1=request_coordinates[0],
                    lat2=vol_coords[1], lon2=vol_coords[0],
                )

            notification_data = {
                "request_id": request_id,
                "volunteer_id": str(volunteer.get("_id", "")),
                "volunteer_phone": volunteer_phone,
                "status": NotificationStatus.SENT.value,
                "radius_km": distance_km,
            }

            notification_id = await self.notification_repo.create(notification_data)

            try:
                await sms_service.send_volunteer_notification(
                    phone=volunteer_phone,
                    resource=resource,
                    urgency=urgency,
                    distance_km=distance_km,
                    location=location_name or "your area",
                )
            except Exception as e:
                logger.warning(f"Failed to send SMS notification to {volunteer_phone}: {e}")

            await self.create_app_notification(
                user_phone=volunteer_phone,
                notification_type=AppNotificationType.NEW_REQUEST,
                title=f"New {resource} request nearby",
                message=f"{urgency.title()} need for {resource} near {location_name or 'your area'}. You are {distance_km:.1f} km away.",
                request_id=request_id,
                data={
                    "resource": resource,
                    "urgency": urgency,
                    "location_name": location_name,
                    "distance_km": round(distance_km, 1),
                },
            )

            notifications.append({
                "id": notification_id,
                "volunteer_phone": volunteer_phone,
                "distance_km": round(distance_km, 1),
            })

        return notifications

    async def mark_accepted(self, request_id: str, volunteer_id: str):
        await self.notification_repo.mark_accepted_for_request(request_id, volunteer_id)


notification_service = NotificationService()