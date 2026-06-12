import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb+srv://resq:resq@resq.sr4vzua.mongodb.net/?appName=ResQ')
    db = client['ResQ']

    user_b = await db.users.find_one({'phone': '+919999000102'})
    print('=== User B ===')
    print(f'  is_volunteer: {user_b.get("is_volunteer")}')
    print(f'  resources: {user_b.get("resources")}')
    print(f'  location: {user_b.get("location")}')
    print(f'  location_name: {user_b.get("location_name")}')

    req = await db.requests.find_one({'requester_phone': '+919999000101'}, sort=[('created_at', -1)])
    print('=== Latest Request ===')
    print(f'  id: {req["_id"]}')
    print(f'  resource: {req.get("resource")}')
    print(f'  location: {req.get("location")}')
    print(f'  status: {req.get("status")}')

    notifs_b = await db.app_notifications.find({'user_phone': '+919999000102'}).to_list(10)
    print(f'=== User B App Notifications: {len(notifs_b)} ===')
    for n in notifs_b:
        print(f'  type={n.get("notification_type")}, title={n.get("title")}, read={n.get("read")}')

    notifs_a = await db.app_notifications.find({'user_phone': '+919999000101'}).to_list(10)
    print(f'=== User A App Notifications: {len(notifs_a)} ===')
    for n in notifs_a:
        print(f'  type={n.get("notification_type")}, title={n.get("title")}')

    # Direct geospatial query test
    req_coords = req.get("location", {}).get("coordinates")
    print(f'\n=== Testing $near query ===')
    print(f'Request coordinates: {req_coords}')
    cursor = db.users.find({
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": req_coords},
                "$maxDistance": 5000,
            }
        },
        "resources": {"$in": [req.get("resource")]},
        "is_volunteer": True,
    })
    vol = await cursor.to_list(10)
    print(f'Volunteers found by $near: {len(vol)}')
    for v in vol:
        print(f'  phone={v.get("phone")}, resources={v.get("resources")}, loc={v.get("location")}')

    client.close()

asyncio.run(check())
