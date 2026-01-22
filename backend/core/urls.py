"""URL configuration for Trip Planner project."""

from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.http import JsonResponse


def health(request):
    return JsonResponse({"ok": True})


def home(request):
    return JsonResponse(
        {
            "service": "HOS ELD Trip Planner API",
            "status": "online",
            "documentation": "/api/docs/",
        }
    )


urlpatterns = [
    path("", home),
    path("healthz", health),
    path("", include("app.urls")),
    # OpenAPI schema and Swagger UI
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="api-schema"),
        name="api-docs",
    ),
]
