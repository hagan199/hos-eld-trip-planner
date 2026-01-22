from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..controllers.trip_controller import plan_trip
from ..serializers import TripPlanSerializer
from drf_spectacular.utils import extend_schema


class TripPlanView(APIView):
    """POST /api/trips/plan

    Delegates to `controllers.trip_controller.plan_trip` for business logic.
    """

    @extend_schema(
        request=TripPlanSerializer,
        responses={
            200: TripPlanSerializer
        },  # In reality response is different, but for now this documents input
    )
    def post(self, request, *args, **kwargs):
        serializer = TripPlanSerializer(data=request.data)
        if serializer.is_valid():
            # Pass validated data to the controller
            # Convert datetime to string or handle strictly if controller expects objects
            # Controller expects dict, serializer.validated_data is a dict with proper types
            # Note: Controller expects 'start_datetime' as string sometimes based on current implementation
            # Let's check logic. Controller: data.get("start_datetime", None) -> expects string or handles it?
            # Controller line 43: start_datetime_str = data.get("start_datetime", None)
            # Controller line 48: datetime.fromisoformat(...)
            # So controller expects string. Serializer returns datetime object.

            validated_data = serializer.validated_data

            # Convert datetime back to string for controller compatibility,
            # OR ideally update controller to handle datetime objects.
            # Improving controller to handle both is safer best practice.
            # But for least invasion, let's adapt here.
            if validated_data.get("start_datetime"):
                validated_data["start_datetime"] = validated_data[
                    "start_datetime"
                ].isoformat()

            result = plan_trip(validated_data)
            return Response(result, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
