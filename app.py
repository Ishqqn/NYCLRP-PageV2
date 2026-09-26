import os
import secrets
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request, session

load_dotenv()

app = Flask(__name__)

# ============================================================
# CONFIG
# ============================================================

app.secret_key = os.getenv("FLASK_SECRET_KEY")

if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY is missing from .env")


DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")

DISCORD_REDIRECT_URI = os.getenv(
    "DISCORD_REDIRECT_URI",
    "http://127.0.0.1:5000/auth/discord/callback"
)

DISCORD_GUILD_ID = "1475908093266100365"
STAFF_ROLE_NAME = "New York City Staff"

DISCORD_API = "https://discord.com/api/v10"

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://127.0.0.1:5500"
)


if not DISCORD_CLIENT_ID:
    raise RuntimeError("DISCORD_CLIENT_ID is missing from .env")

if not DISCORD_CLIENT_SECRET:
    raise RuntimeError("DISCORD_CLIENT_SECRET is missing from .env")


# ============================================================
# DISCORD OAUTH
# ============================================================

@app.route("/auth/discord")
def discord_login():

    state = secrets.token_urlsafe(32)

    session["oauth_state"] = state

    params = {
        "client_id": DISCORD_CLIENT_ID,
        "redirect_uri": DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify guilds.members.read",
        "state": state
    }

    discord_url = (
        "https://discord.com/oauth2/authorize?"
        + urlencode(params)
    )

    return redirect(discord_url)


# ============================================================
# OAUTH CALLBACK
# ============================================================

@app.route("/auth/discord/callback")
def discord_callback():

    error = request.args.get("error")

    if error:
        return redirect(
            FRONTEND_URL + "/?error=discord_denied"
        )


    code = request.args.get("code")
    state = request.args.get("state")

    saved_state = session.pop("oauth_state", None)


    if not code:
        return redirect(
            FRONTEND_URL + "/?error=missing_code"
        )


    if not state or state != saved_state:
        return redirect(
            FRONTEND_URL + "/?error=invalid_state"
        )


    # --------------------------------------------------------
    # EXCHANGE CODE FOR ACCESS TOKEN
    # --------------------------------------------------------

    token_response = requests.post(
        f"{DISCORD_API}/oauth2/token",
        data={
            "client_id": DISCORD_CLIENT_ID,
            "client_secret": DISCORD_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": DISCORD_REDIRECT_URI
        },
        headers={
            "Content-Type":
                "application/x-www-form-urlencoded"
        },
        timeout=10
    )


    if not token_response.ok:

        print(
            "Discord token error:",
            token_response.status_code,
            token_response.text
        )

        return redirect(
            FRONTEND_URL + "/?error=token_exchange_failed"
        )


    token_data = token_response.json()

    access_token = token_data.get("access_token")


    if not access_token:
        return redirect(
            FRONTEND_URL + "/?error=no_access_token"
        )


    # --------------------------------------------------------
    # GET DISCORD USER
    # --------------------------------------------------------

    headers = {
        "Authorization": f"Bearer {access_token}"
    }


    user_response = requests.get(
        f"{DISCORD_API}/users/@me",
        headers=headers,
        timeout=10
    )


    if not user_response.ok:

        return redirect(
            FRONTEND_URL + "/?error=user_fetch_failed"
        )


    user = user_response.json()


    # --------------------------------------------------------
    # CHECK SERVER MEMBERSHIP
    # --------------------------------------------------------

    member_response = requests.get(
        f"{DISCORD_API}/users/@me/guilds/{DISCORD_GUILD_ID}/member",
        headers=headers,
        timeout=10
    )


    if member_response.status_code == 404:

        return redirect(
            FRONTEND_URL + "/?error=not_server_member"
        )


    if not member_response.ok:

        print(
            "Guild member error:",
            member_response.status_code,
            member_response.text
        )

        return redirect(
            FRONTEND_URL + "/?error=guild_check_failed"
        )


    member = member_response.json()


    # --------------------------------------------------------
    # CHECK STAFF ROLE
    # --------------------------------------------------------

    roles = member.get("roles", [])


    # IMPORTANT:
    # guilds.members.read gives role IDs, not role names.
    #
    # Therefore we need the role ID.
    #
    # Set STAFF_ROLE_ID in .env after copying the
    # "New York City Staff" role ID from Discord.
    # --------------------------------------------------------

    staff_role_id = os.getenv("STAFF_ROLE_ID")


    if not staff_role_id:

        return (
            "STAFF_ROLE_ID is missing from .env.",
            500
        )


    if staff_role_id not in roles:

        return redirect(
            FRONTEND_URL + "/?error=no_staff_role"
        )


    # --------------------------------------------------------
    # SAVE SESSION
    # --------------------------------------------------------

    session["user"] = {
        "id": user["id"],
        "username": user.get(
            "global_name"
        ) or user.get(
            "username"
        ),
        "avatar": user.get("avatar"),
        "staff": True
    }


    return redirect(
        FRONTEND_URL + "/"
    )


# ============================================================
# CURRENT USER
# ============================================================

@app.route("/api/me")
def current_user():

    user = session.get("user")


    if not user:

        return jsonify({
            "authenticated": False
        }), 401


    return jsonify({
        "authenticated": True,
        "user": user
    })


# ============================================================
# LOGOUT
# ============================================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect(
        FRONTEND_URL + "/"
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health")
def health():

    return jsonify({
        "status": "online",
        "service": "NYCLRP Staff Panel Backend"
    })


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
