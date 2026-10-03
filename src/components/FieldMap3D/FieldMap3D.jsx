import { useEffect, useRef } from "react";

import {
  Viewer,
  Ion,
  Terrain,
  Cartesian3,
  Math as CesiumMath,
  Color,
  PolygonHierarchy,
  HeightReference,
} from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";
import "./FieldMap3D.css";

Ion.defaultAccessToken =
  import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;

function FieldMap3D({
  position = null,
  boundary = [],
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  /*
   * =====================================================
   * CREATE CESIUM VIEWER
   * =====================================================
   */

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const viewer = new Viewer(
      containerRef.current,
      {
        terrain: Terrain.fromWorldTerrain(),

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
      }
    );

    viewerRef.current = viewer;


    /*
     * =================================================
     * CAMERA CONTROLS
     * =================================================
     */

    const controller =
      viewer.scene.screenSpaceCameraController;

    /*
     * Enable normal interaction
     */

    controller.enableInputs = true;
    controller.enableZoom = true;
    controller.enableRotate = true;
    controller.enableTilt = true;
    controller.enableLook = true;


    /*
     * SLOW DOWN ZOOM
     *
     * Cesium default = 5.0
     *
     * Lower value = slower, more controlled zoom.
     */

    controller.zoomFactor = 1.5;


    /*
     * Reduce zoom inertia.
     *
     * This prevents the map from continuing
     * to zoom after the wheel stops.
     */

    controller.inertiaZoom = 0.3;


    /*
     * Prevent the camera from getting
     * absurdly close to the terrain.
     */

    controller.minimumZoomDistance = 20;


    /*
     * Prevent the user from zooming
     * ridiculously far away.
     */

    controller.maximumZoomDistance = 500000;


    /*
     * Keep terrain collision enabled.
     */

    controller.enableCollisionDetection = true;


    /*
     * Prevent extreme underground tilt.
     */

    controller.maximumTiltAngle =
      CesiumMath.toRadians(80);


    /*
     * Terrain depth testing.
     */

    viewer.scene.globe.depthTestAgainstTerrain =
      true;


    /*
     * Cleanup
     */

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }

      viewerRef.current = null;
    };
  }, []);


  /*
   * =====================================================
   * FIELD DATA
   * =====================================================
   */

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }


    /*
     * Remove previous field entities.
     */

    viewer.entities.removeAll();


    /*
     * =================================================
     * FIELD BOUNDARY
     * =================================================
     */

    if (boundary.length >= 3) {

      const coordinates = [];

      boundary.forEach((point) => {
        coordinates.push(point.lng);
        coordinates.push(point.lat);
      });


      const hierarchy =
        new PolygonHierarchy(
          Cartesian3.fromDegreesArray(
            coordinates
          )
        );


      viewer.entities.add({
        name: "KhetVardhan Field",

        polygon: {
          hierarchy,

          material:
            Color.fromCssColorString(
              "#72ff5d"
            ).withAlpha(0.28),

          outline: true,

          outlineColor:
            Color.fromCssColorString(
              "#72ff5d"
            ),

          outlineWidth: 3,

          heightReference:
            HeightReference.CLAMP_TO_GROUND,
        },
      });
    }


    /*
     * =================================================
     * FIELD CENTER
     * =================================================
     */

    if (position) {

      viewer.entities.add({
        name: "Field Center",

        position:
          Cartesian3.fromDegrees(
            position.lng,
            position.lat
          ),

        point: {
          pixelSize: 12,

          color:
            Color.fromCssColorString(
              "#72ff5d"
            ),

          outlineColor:
            Color.fromCssColorString(
              "#08120b"
            ),

          outlineWidth: 3,

          heightReference:
            HeightReference.CLAMP_TO_GROUND,
        },
      });


      /*
       * =================================================
       * INITIAL CAMERA
       * =================================================
       *
       * Start high enough to see the field,
       * but not so high that the field becomes tiny.
       */

      viewer.camera.flyTo({
        destination:
          Cartesian3.fromDegrees(
            position.lng,
            position.lat,
            2500
          ),

        orientation: {
          heading:
            CesiumMath.toRadians(0),

          pitch:
            CesiumMath.toRadians(-50),

          roll: 0,
        },

        duration: 1.5,
      });
    }

  }, [position, boundary]);


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div
      ref={containerRef}
      className="kv-real-map-3d"
    />
  );
}

export default FieldMap3D;