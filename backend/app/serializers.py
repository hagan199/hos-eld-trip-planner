from rest_framework import serializers


class LocationSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    address = serializers.CharField(required=False, allow_blank=True)


class TripPlanSerializer(serializers.Serializer):
    start = LocationSerializer()
    pickup = LocationSerializer()
    dropoff = LocationSerializer()
    current_cycle_used_hours = serializers.FloatField(required=False, default=0.0)
    start_datetime = serializers.DateTimeField(required=False, allow_null=True)
