from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.deps import get_current_user
from app.repositories.repositories import NotificationRepo, AppNotificationRepo
from app.schemas.schemas import NotificationResponse, AppNotificationResponse, UnreadCountResponse


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[AppNotificationResponse])
async def list_notifications(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    repo = AppNotificationRepo()
    notifications = await repo.list_by_phone(current_user["phone"], limit=limit, skip=skip)
    return [
        AppNotificationResponse(
            _id=str(n["_id"]),
            user_phone=n["user_phone"],
            notification_type=n["notification_type"],
            title=n["title"],
            message=n["message"],
            request_id=n.get("request_id"),
            data=n.get("data"),
            read=n.get("read", False),
            created_at=n["created_at"],
        )
        for n in notifications
    ]


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
):
    repo = AppNotificationRepo()
    count = await repo.count_unread(current_user["phone"])
    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=AppNotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    repo = AppNotificationRepo()
    notification = await repo.get_by_id(notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if notification["user_phone"] != current_user["phone"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your notification")

    await repo.mark_read(notification_id, current_user["phone"])
    updated = await repo.get_by_id(notification_id)
    return AppNotificationResponse(
        _id=str(updated["_id"]),
        user_phone=updated["user_phone"],
        notification_type=updated["notification_type"],
        title=updated["title"],
        message=updated["message"],
        request_id=updated.get("request_id"),
        data=updated.get("data"),
        read=updated.get("read", True),
        created_at=updated["created_at"],
    )


@router.post("/mark-all-read", response_model=dict)
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
):
    repo = AppNotificationRepo()
    count = await repo.mark_all_read(current_user["phone"])
    return {"marked_read": count}


@router.get("/sms", response_model=list[NotificationResponse])
async def list_sms_notifications(
    current_user: dict = Depends(get_current_user),
):
    notification_repo = NotificationRepo()
    notifications = await notification_repo.collection.find(
        {"volunteer_phone": current_user["phone"]}
    ).sort("created_at", -1).to_list(length=50)

    return [
        NotificationResponse(
            _id=str(n["_id"]),
            request_id=n["request_id"],
            volunteer_id=n.get("volunteer_id"),
            volunteer_phone=n["volunteer_phone"],
            status=n["status"],
            radius_km=n.get("radius_km", 5.0),
            created_at=n["created_at"],
        )
        for n in notifications
    ]