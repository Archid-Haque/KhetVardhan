import { useEffect, useRef } from "react";

import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  BoundingSphere,
  Color,
  EllipsoidTerrainProvider,
  HeightReference,
  HeadingPitchRange,
  ImageryLayer,
  LabelStyle,
  Math as CesiumMath,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
} from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";
import "./FieldMap3D.css";

const IMAGERY_CREDIT = "Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community";
const LABEL_CREDIT = "Esri, HERE, Garmin, FAO, NOAA, USGS";

function FieldMap3D({
  position = null,
  currentPosition = null,
  boundary = [],
  onLocationSelect,
  onBoundaryChange,
  drawBoundary = false,
  pinMode = false,
  focusPosition = null,
  focusToken = 0,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const interactionRef = useRef({});
  const focusRef = useRef(null);
  const lastFocusTokenRef = useRef(focusToken);

  useEffect(() => {
    interactionRef.current = {
      onLocationSelect,
      onBoundaryChange,
      drawBoundary,
      pinMode,
      boundary,
    };
  }, [onLocationSelect, onBoundaryChange, drawBoundary, pinMode, boundary]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const viewer = new Viewer(containerRef.current, {
      terrainProvider: new EllipsoidTerrainProvider(),
      baseLayer: new ImageryLayer(new UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        credit: IMAGERY_CREDIT,
        maximumLevel: 19,
        enablePickFeatures: false,
      })),
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
    });

    viewerRef.current = viewer;
    viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      credit: LABEL_CREDIT,
      maximumLevel: 19,
      enablePickFeatures: false,
    }));
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.screenSpaceCameraController.zoomFactor = 1.6;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 30;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 500000;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
      const state = interactionRef.current;
      if (!state.drawBoundary && !state.pinMode) return;

      const picked = viewer.scene.pickPosition(event.position);
      const cartesian = picked || viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;

      const cartographic = Cartographic.fromCartesian(cartesian);
      const point = {
        lat: CesiumMath.toDegrees(cartographic.latitude),
        lng: CesiumMath.toDegrees(cartographic.longitude),
      };

      if (state.drawBoundary) {
        state.onBoundaryChange?.([...state.boundary, point]);
      } else {
        state.onLocationSelect?.(point);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.entities.removeAll();

    if (boundary.length >= 3) {
      const coordinates = boundary.flatMap((point) => [point.lng, point.lat]);
      viewer.entities.add({
        id: "farm-boundary",
        name: "Farm boundary",
        polygon: {
          hierarchy: new PolygonHierarchy(Cartesian3.fromDegreesArray(coordinates)),
          material: Color.fromCssColorString("#a9df87").withAlpha(0.3),
          outline: true,
          outlineColor: Color.fromCssColorString("#c5f1a6"),
          outlineWidth: 3,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
    }

    boundary.forEach((point, index) => {
      viewer.entities.add({
        id: `boundary-point-${index}`,
        name: `Boundary point ${index + 1}`,
        position: Cartesian3.fromDegrees(point.lng, point.lat),
        point: {
          pixelSize: 8,
          color: Color.fromCssColorString("#d9f5bd"),
          outlineColor: Color.fromCssColorString("#15341e"),
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
    });

    if (position) {
      viewer.entities.add({
        id: "farm-center",
        name: "Farm pin",
        position: Cartesian3.fromDegrees(position.lng, position.lat),
        point: {
          pixelSize: 15,
          color: Color.fromCssColorString("#b5f28a"),
          outlineColor: Color.fromCssColorString("#102218"),
          outlineWidth: 4,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: "FARM PIN",
          font: "600 11px Inter, sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.fromCssColorString("#102218"),
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(0, -24),
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
    }

    if (currentPosition) {
      viewer.entities.add({
        id: "device-location",
        name: "Your device location",
        position: Cartesian3.fromDegrees(currentPosition.lng, currentPosition.lat),
        point: {
          pixelSize: 11,
          color: Color.fromCssColorString("#76d5ff"),
          outlineColor: Color.WHITE,
          outlineWidth: 3,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: "YOU ARE HERE",
          font: "600 10px Inter, sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.fromCssColorString("#102218"),
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(0, -21),
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
    }
  }, [position, currentPosition, boundary]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const requestedFocus = focusToken !== lastFocusTokenRef.current;
    lastFocusTokenRef.current = focusToken;
    const target = requestedFocus && focusPosition ? focusPosition : currentPosition || position;
    const focusKey = `${focusToken}:${target ? `${target.lat.toFixed(5)}:${target.lng.toFixed(5)}` : "regional"}`;
    if (focusRef.current === focusKey) return;
    focusRef.current = focusKey;

    if (!requestedFocus && boundary.length >= 3) {
      const points = boundary.map((point) => Cartesian3.fromDegrees(point.lng, point.lat));
      const bounds = BoundingSphere.fromPoints(points);
      viewer.camera.flyToBoundingSphere(bounds, {
        offset: new HeadingPitchRange(0, CesiumMath.toRadians(-78), Math.max(350, bounds.radius * 3.2)),
        duration: 1.6,
      });
      return;
    }

    if (target) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(target.lng, target.lat, 650),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(-78),
          roll: 0,
        },
        duration: 1.4,
      });
    } else {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(91.91, 25.68, 45000),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(-78),
          roll: 0,
        },
        duration: 1.4,
      });
    }
  }, [position, currentPosition, boundary, focusPosition, focusToken]);

  return <div ref={containerRef} className="kv-real-map-3d" aria-label="Interactive 3D satellite map" />;
}

export default FieldMap3D;
