import os
import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

PRICE_PRO = os.getenv("STRIPE_PRICE_PRO")
PRICE_ANNUAL = os.getenv("STRIPE_PRICE_ANNUAL")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def create_checkout_session(user_id: str, user_email: str, plan_type: str, stripe_customer_id: str = None):
    """
    plan_type: 'pro_monthly' or 'annual' (both are recurring subscriptions).
    Returns the Checkout Session URL.
    """
    if plan_type == "pro_monthly":
        price_id = PRICE_PRO
        mode = "subscription"
    elif plan_type == "annual":
        price_id = PRICE_ANNUAL
        mode = "subscription"
    else:
        raise ValueError(f"Unknown plan_type: {plan_type}")

    params = {
        "mode": mode,
        "payment_method_types": ["card"],
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": f"{FRONTEND_URL}/?stripe=success",
        "cancel_url": f"{FRONTEND_URL}/?stripe=cancel",
        "allow_promotion_codes": True,
        "metadata": {
            "user_id": user_id,
            "plan_type": plan_type,
        },
        "client_reference_id": user_id,
    }

    if stripe_customer_id:
        params["customer"] = stripe_customer_id
    else:
        params["customer_email"] = user_email

    session = stripe.checkout.Session.create(**params)
    return session.url


def verify_webhook_signature(payload: bytes, sig_header: str):
    """Verifies the webhook signature and returns the event."""
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
        return event
    except ValueError:
        raise ValueError("Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid signature")


def create_customer_portal_session(stripe_customer_id: str):
    """Create a billing portal session for a customer."""
    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=f"{FRONTEND_URL}/",
    )
    return session.url
