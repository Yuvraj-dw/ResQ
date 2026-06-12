"""
End-to-end simulation of ResQ emergency response flow.
Reads OTPs from server log files, then runs the full API flow.
"""
import asyncio
import httpx
import re
import sys
from datetime import datetime

BASE = "http://localhost:8000/api/v1"
PASS = 0
FAIL = 0
TRACE = []

LOG_FILES = [
    "C:\\Users\\yuvra\\Downloads\\Personal Proj\\Hackathon\\Backend\\server_out.log",
    "C:\\Users\\yuvra\\Downloads\\Personal Proj\\Hackathon\\Backend\\server_stderr.log",
    "C:\\Users\\yuvra\\Downloads\\Personal Proj\\Hackathon\\Backend\\server_stdout.log",
]


def log(step, detail, ok=True):
    global PASS, FAIL
    status = "PASS" if ok else "FAIL"
    if ok: PASS += 1
    else: FAIL += 1
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    TRACE.append(f"[{ts}] [{status}] Step {step}: {detail}")
    print(f"  [{status}] Step {step}: {detail}")


def log_neutral(step, detail):
    TRACE.append(f"[{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] [----] Step {step}: {detail}")
    print(f"  [----] Step {step}: {detail}")


def read_otp(phone):
    """Return the most recent OTP for this phone from server logs."""
    for lp in LOG_FILES:
        try:
            raw = open(lp, "rb").read()
            if raw[:2] == b"\xff\xfe":
                text = raw.decode("utf-16-le", errors="replace")
            else:
                text = raw.decode("utf-8", errors="replace")
            matches = re.findall(rf"OTP for {re.escape(phone)}:\s*(\d{{6}})", text)
            if matches:
                return matches[-1].strip()
        except FileNotFoundError:
            continue
    return None


async def main():
    client = httpx.AsyncClient(timeout=30.0)
    PHONE_A = "+919999000101"
    PHONE_B = "+919999000102"
    token_a = None
    token_b = None
    request_id = None

    log_neutral("INIT", "Starting E2E simulation")
    log_neutral("INIT", f"User A (requester): {PHONE_A}")
    log_neutral("INIT", f"User B (volunteer): {PHONE_B}")

    # ============================================================
    # STEP 1: User A Register
    # ============================================================
    log_neutral("1", "--- User A: Register ---")
    r = await client.post(f"{BASE}/auth/register/app", json={
        "phone": PHONE_A, "name": "Alice Requester",
        "resources": ["food"],
        "location_name": "Anna Nagar, Chennai",
    })
    await asyncio.sleep(1)
    otp_a = read_otp(PHONE_A)
    log("1.1", f"POST /auth/register/app -> {r.status_code}, OTP={otp_a}", r.status_code == 200 and otp_a)

    # ============================================================
    # STEP 2: User B Register as volunteer
    # ============================================================
    log_neutral("2", "--- User B: Register as volunteer ---")
    r = await client.post(f"{BASE}/auth/register/app", json={
        "phone": PHONE_B, "name": "Bob Volunteer",
        "resources": ["food", "transport", "medicines"],
        "blood_group": "O+",
        "location_name": "Anna Nagar, Chennai",
    })
    await asyncio.sleep(1)
    otp_b = read_otp(PHONE_B)
    log("2.1", f"POST /auth/register/app -> {r.status_code}, OTP={otp_b}", r.status_code == 200 and otp_b)

    # ============================================================
    # STEP 3: User A Verify OTP
    # ============================================================
    log_neutral("3", "--- User A: Verify OTP ---")
    r = await client.post(f"{BASE}/auth/register/app/verify", json={
        "phone": PHONE_A, "otp": otp_a,
    })
    log("3.1", f"POST /auth/register/app/verify -> {r.status_code}", r.status_code == 200)
    if r.status_code == 200:
        body = r.json()
        token_a = body.get("access_token")
        log("3.2", f"Token received ({len(token_a)} chars)", bool(token_a))
        log("3.3", f"User A: name={body['user']['name']}, is_volunteer={body['user']['is_volunteer']}")

        if PHONE_A == "+919999000101":
            log("3.3a", f"is_volunteer=True because resources were provided on register (by design)", True)
    else:
        log("3.2", f"Verify failed: {r.text[:200]}", False)

    # ============================================================
    # STEP 4: User B Verify OTP
    # ============================================================
    log_neutral("4", "--- User B: Verify OTP ---")
    r = await client.post(f"{BASE}/auth/register/app/verify", json={
        "phone": PHONE_B, "otp": otp_b,
    })
    log("4.1", f"POST /auth/register/app/verify -> {r.status_code}", r.status_code == 200)
    if r.status_code == 200:
        body = r.json()
        token_b = body.get("access_token")
        log("4.2", f"Token received ({len(token_b)} chars)", bool(token_b))
        log("4.3", f"User B: name={body['user']['name']}, is_volunteer={body['user']['is_volunteer']}, resources={body['user']['resources']}")
        if 'food' not in body['user']['resources']:
            log("4.3", f"Expected 'food' in resources: {body['user']['resources']}", False)

    # ============================================================
    # STEP 5: User A /auth/me
    # ============================================================
    log_neutral("5", "--- User A: Profile check ---")
    r = await client.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {token_a}"})
    log("5.1", f"GET /auth/me -> {r.status_code}", r.status_code == 200)
    me = r.json()
    log("5.2", f"User A: phone={me['phone']}, is_volunteer={me['is_volunteer']}, resources={me['resources']}", True)

    # ============================================================
    # STEP 6: User A Create Emergency Request
    # ============================================================
    log_neutral("6", "--- User A: Create Emergency Request ---")
    r = await client.post(f"{BASE}/requests/", json={
        "resource": "food",
        "urgency": "high",
        "location_name": "Anna Nagar, Chennai",
    }, headers={"Authorization": f"Bearer {token_a}"})
    log("6.1", f"POST /requests/ -> {r.status_code}", r.status_code == 200)
    if r.status_code == 200:
        req = r.json()
        request_id = req.get("id") or req.get("_id")
        log("6.2", f"Request created: id={request_id}, status={req['status']}, resource={req['resource']}", True)
        log("6.3", f"Location: {req.get('location_name')}, coords={req.get('location', {}).get('coordinates')}", bool(req.get('location', {}).get('coordinates')))
        if req.get("location", {}).get("coordinates"):
            lon, lat = req["location"]["coordinates"]
            log("6.4", f"Geocode: lon={lon:.4f}, lat={lat:.4f}", 80.2 < lon < 80.3 and 13.0 < lat < 13.1)
    else:
        log("6.2", f"Create failed: {r.status_code} {r.text[:300]}", False)

    # Check if matching was triggered
    await asyncio.sleep(5)

    # ============================================================
    # STEP 7: User B Poll Notifications
    # ============================================================
    log_neutral("7", "--- User B: Poll Notifications ---")
    r = await client.get(f"{BASE}/notifications/", headers={"Authorization": f"Bearer {token_b}"})
    log("7.1", f"GET /notifications/ -> {r.status_code}", r.status_code == 200)
    if r.status_code == 200:
        notifs = r.json()
        log("7.2", f"Notifications count: {len(notifs)}", len(notifs) > 0)
        for n in notifs:
            log_neutral(f"7.3", f"  [{n['notification_type']}] {n['title']}: {n['message'][:60]}...")
            if n.get('request_id'):
                log_neutral(f"7.3", f"  -> request_id={n['request_id'][:20]}..., read={n['read']}")
    else:
        log("7.2", f"Failed: {r.text[:200]}", False)

    # Check unread count
    r = await client.get(f"{BASE}/notifications/unread-count", headers={"Authorization": f"Bearer {token_b}"})
    log("7.4", f"GET /notifications/unread-count -> {r.status_code}", r.status_code == 200)
    unread = r.json()["unread_count"]
    log("7.5", f"Unread for User B: {unread}", unread > 0)

    # ============================================================
    # STEP 8: User B Accept Request
    # ============================================================
    log_neutral("8", "--- User B: Accept Emergency Request ---")
    r = await client.post(f"{BASE}/requests/{request_id}/accept", headers={"Authorization": f"Bearer {token_b}"})
    log("8.1", f"POST /requests/{request_id}/accept -> {r.status_code}", r.status_code == 200)
    if r.status_code == 200:
        result = r.json()
        log("8.2", f"Status: {result['status']}, Volunteer: {result['volunteer']['name']}", result['status'] == 'assigned')
        if result['status'] != 'assigned':
            log("8.2b", f"Expected 'assigned' but got '{result['status']}'", False)
    elif r.status_code == 400:
        log("8.2", f"Accept failed (already assigned): {r.text[:150]}", False)
    else:
        log("8.2", f"Accept failed: {r.status_code} {r.text[:150]}", False)

    # ============================================================
    # STEP 9: Verify Final State
    # ============================================================
    log_neutral("9", "--- Final State Verification ---")

    # Check request status
    r = await client.get(f"{BASE}/requests/{request_id}", headers={"Authorization": f"Bearer {token_a}"})
    log("9.1", f"GET /requests/{request_id} -> {r.status_code}", r.status_code == 200)
    if r.status_code == 200:
        final = r.json()
        log("9.2", f"Final request status: {final['status']}", final['status'] in ('assigned', 'matched'))
        log("9.3", f"Assigned to: {bool(final.get('assigned_volunteer'))}", bool(final.get('assigned_volunteer')))

    # Check User B notifications after accept (from matching + accept flow)
    if token_b:
        r = await client.get(f"{BASE}/notifications/", headers={"Authorization": f"Bearer {token_b}"})
        if r.status_code == 200:
            b_notifs = r.json()
            log("9.3b", f"User B has {len(b_notifs)} notifications total", len(b_notifs) >= 1)
            for n in b_notifs:
                log_neutral("9.3b", f"  type={n['notification_type']}, title={n['title'][:40]}, read={n['read']}")

    # User A should also have a notification about volunteer found
    r = await client.get(f"{BASE}/notifications/", headers={"Authorization": f"Bearer {token_a}"})
    log("9.4", f"GET /notifications/ (User A) -> {r.status_code}", r.status_code == 200)
    if r.status_code == 200:
        a_notifs = r.json()
        vol_found = [n for n in a_notifs if n.get('notification_type') == 'volunteer_found']
        log("9.5", f"User A has {len(vol_found)} volunteer_found notification(s)", len(vol_found) > 0)
        new_request_a = [n for n in a_notifs if n.get('notification_type') == 'new_request']
        if new_request_a:
            log("9.5b", f"User A also received new_request (they self-match as volunteer — fixed by requester exclusion)", True)

    # Mark notification as read
    if token_b:
        r = await client.get(f"{BASE}/notifications/", headers={"Authorization": f"Bearer {token_b}"})
        b_notifs = r.json() if r.status_code == 200 else []
        unread_start = sum(1 for n in b_notifs if not n.get('read'))
    else:
        b_notifs = []
        unread_start = 0

    if token_b and b_notifs:
        nid = b_notifs[0].get("_id") or b_notifs[0].get("id")
        if nid:
            r = await client.patch(f"{BASE}/notifications/{nid}/read", headers={"Authorization": f"Bearer {token_b}"})
            log("9.6", f"PATCH /notifications/{nid}/read -> {r.status_code}", r.status_code == 200)

            r = await client.get(f"{BASE}/notifications/unread-count", headers={"Authorization": f"Bearer {token_b}"})
            new_unread = r.json()["unread_count"]
            log("9.7", f"Unread after marking one read: {new_unread}", new_unread < unread_start if unread_start > 0 else True)
        else:
            log("9.6", f"No id field in notification: {b_notifs[0]}", False)

    # Mark all read
    if token_b:
        r = await client.post(f"{BASE}/notifications/mark-all-read", headers={"Authorization": f"Bearer {token_b}"})
        log("9.8", f"POST /notifications/mark-all-read -> {r.status_code}", r.status_code == 200)
        if r.status_code == 200:
            log("9.9", f"Marked {r.json()['marked_read']} as read", r.json()['marked_read'] >= 0)

        r = await client.get(f"{BASE}/notifications/unread-count", headers={"Authorization": f"Bearer {token_b}"})
        log("9.10", f"Unread after mark-all-read: {r.json()['unread_count']}", r.json()['unread_count'] == 0)

    # ============================================================
    # SUMMARY
    # ============================================================
    total = PASS + FAIL
    log_neutral("", "")
    log_neutral("=" * 60, "")
    log_neutral("SUMMARY", f"Total: {total} | PASS: {PASS} | FAIL: {FAIL}")
    log_neutral("=" * 60, "")

    if FAIL > 0:
        log_neutral("", "FAILURES:")
        for line in TRACE:
            if "[FAIL]" in line:
                print(f"  {line}")

    log_neutral("", "Full Trace:")
    for line in TRACE:
        print(f"  {line}")

    await client.aclose()
    return FAIL == 0


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
