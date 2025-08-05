"use strict";

var clippingPlaneConfig = {
    orientation: {
        'Disabled': 0,
        'Horizontal': 1,
        'Vertical': 2
    },

    parameters: {
        o: 0,
        x: 1,
        y: 0,
        z: 0,
        constant: 900,

        d: 0, // vertical / horizontal "distance"
        az: 0, // azimuth
		flip: false, // mirroring vector orientation

		vector_z: -1 // vector z direction orientation parameter
    }
};

var clippingPlane = new function() {
    var _this = this,
        app = Q3D.application,
        q3dGui = Q3D.gui.dat,
        __params = clippingPlaneConfig.parameters,
        scene;

    var axis_values = {};

    this.guiElems = {
        folder: {},
        controllers: {}
    };

    var _gui_controllers = this.guiElems.controllers;

    this.gui = {
        set 'Base'(v) {
            if (v) {
                _this.guiElems.folder = q3dGui.gui.addFolder('Clipping plane');

                // Add Orientation
                _gui_controllers.orientation = _this.guiElems.folder
                    .add( clippingPlane.guiProps, 'Orientation', clippingPlaneConfig.orientation )
                    .onChange(_this.guiOrientationOnChange);
            } else {
                q3dGui.gui.removeFolder(_this.guiElems.folder);
            }
        },

        set 'Altitude'(v) {
            if (v) {
                let axis_values = _this.getAxisValues('z');
                __params.d = axis_values.mid;
                _this.guiElems.controllers.altitude = _this.guiElems.folder
                    .add(_this.guiProps, 'Altitude')
                    .min(axis_values.min)
                    .max(axis_values.max)
                    .onChange(_this.guiAltitudeOnChange);
            } else if (!v && typeof _gui_controllers.altitude != 'undefined') {
                _this.guiRemoveController('altitude');
            }
        },

        set 'Distance'(v) {
            if (v) {
                let axis_values = _this.getAxisValues('y');
                console.log("Interval: " + axis_values.interval)
                __params.d = axis_values.interval;
                _this.guiElems.controllers.distance = _this.guiElems.folder
                    .add(_this.guiProps, 'Distance')
                    .min(0)
                    .max(axis_values.interval*2)
                    .onChange(_this.guiDistanceOnChange);
            } else if (!v && typeof _gui_controllers.distance != 'undefined') {
                _this.guiRemoveController('distance');
            }
        },

        set 'Azimuth'(v) {
            if (v) {
                __params.az = (__params.o === clippingPlaneConfig.orientation.Vertical) ? 90 : 0;
                _this.guiElems.controllers.azimuth = _this.guiElems.folder
                    .add(_this.guiProps, 'Azimuth')
                    .min(0)
                    .max(360)
                    .onChange(_this.guiAzimuthOnChange);
            } else if (!v && typeof _gui_controllers.azimuth != 'undefined') {
                _this.guiRemoveController('azimuth');
            }
        },

        set 'Flip'(v) {
            if (v) {
                _this.guiElems.controllers.flip = _this.guiElems.folder
                    .add(_this.guiProps, 'Flip');
            } else if (!v && typeof _gui_controllers.flip != 'undefined') {
                _this.guiRemoveController('flip');
			}
		},
    };

    this.guiProps = {
        get 'Orientation'() {
            return __params.o;
        },
        set 'Orientation'(v) {
            if (Object.values(clippingPlaneConfig.orientation).includes(parseInt(v))) {
                __params.o = parseInt(v);
            } else {
                console.warn("Invalid Orientation value: " + v);
            }
        },

        get 'Altitude'() {
            return __params.d;
        },
        set 'Altitude'(v) {
            __params.d = v;
        },

        get 'Distance'() {
            return __params.d;
        },
        set 'Distance'(v) {
            __params.d = v;
        },

        get 'Azimuth'() {
            return __params.az;
        },
        set 'Azimuth'(v) {
            __params.az = v;
        },

        get 'Flip'() {
            return __params.flip;
        },
        set 'Flip'(v) {
            __params.flip = v;

            __params.vector_z = (v) ? 1 : -1;
            _this.plane.alignCutPlane();
            _this.plane.getHelper().updateMatrixWorld();
            app.render();
        },
    };

    this.boot = function() {
        scene = app.scene;

        ['x', 'y', 'z'].forEach(function (value) {
            axis_values[value] = _this.getAxisValues(value);
        });

        _this.gui.Base = true;
    };

    this.guiRemoveController = function (controller_name) {
        _gui_controllers[controller_name].domElement.closest('li').remove();
        delete(_gui_controllers[controller_name]);
    }

    this.guiOrientationOnChange = function (orientation) {
        console.log('oritnetaton ' + orientation)
        _this.gui.Azimuth = false;
        _this.gui.Altitude = false;
        _this.gui.Flip = false;
        _this.gui.Distance = false;

        _this.plane.remove();
        _this.plane.render();

        if (orientation == clippingPlaneConfig.orientation.Horizontal) {
            _this.gui.Altitude = true;
            _this.gui.Flip = true;
        }

        if (orientation == clippingPlaneConfig.orientation.Vertical) {
            _this.gui.Distance = true;
            _this.gui.Azimuth = true;
			__params.flip = false;
			__params.vector_z = -1;
        }
    };

    this.guiAltitudeOnChange = function (value) {
        _this.plane.getHelper().position.z = value * scene.userData.zScale;
        _this.plane.alignCutPlane();
        _this.plane.getHelper().updateMatrixWorld();
        app.render();
    };

    this.guiAzimuthOnChange = function (value) {
        _this.plane.getHelper().rotation.y = Math.PI / 180 * value * -1; // needed to have correct orientation for 0 azimuth and direction of rotation
        _this.plane.alignCutPlane();
        _this.plane.getHelper().updateMatrixWorld();
        app.render();
    };

    this.guiDistanceOnChange = function (value) {
        let axis_values = _this.getAxisValues('y');
        var _value = value - axis_values.interval;
		var moveX = _value * (Math.cos(Math.PI/180 * (__params.az - 90) * -1 ));
		var moveY = _value * (Math.sin(Math.PI/180 * (__params.az - 90) * -1 ));
        _this.plane.getHelper().position.x = moveX;
        _this.plane.getHelper().position.y = moveY;
        _this.plane.alignCutPlane();
        _this.plane.getHelper().updateMatrixWorld();
        app.render();
    }

    this.guiFlipOnChange = function (value) {
        if(__params.flip === false) __params.vector_z = -1;
        else __params.vector_z = 1;
        app.render();
    }

    this.getAxisValues = function(axis) {
        if (typeof axis_values[axis] == 'undefined') {
            console.info('getAxisValues from scene')

            if (!['x', 'y', 'z'].includes(axis)) {
                console.error("Invalid axis: " + axis);
                return;
            }

            var box = new THREE.Box3().setFromObject(scene);

            var getVal = function(axis, type) {
                return scene.toMapCoordinates({
                    x: (axis === 'x') ? box[type].x : 0,
                    y: (axis === 'y') ? box[type].y : 0,
                    z: (axis === 'z') ? box[type].z : 0
                })[axis];
            }

            axis_values[axis] = {
                'min': getVal(axis, 'min'),
                'max': getVal(axis, 'max')
            };

            axis_values[axis].mid = (axis_values[axis].max + axis_values[axis].min) / 2;
            axis_values[axis].interval = axis_values[axis].max - axis_values[axis].min;
        } else {
            console.info('getAxisValues from cache')
        }

        return axis_values[axis];
    };

    this.plane = new function() {
        var _plane = this;

        var normal = new THREE.Vector3(),
            point = new THREE.Vector3();

        this.helper_plane = null;
        this.cut_plane = new THREE.Plane();


        this.render = function () {
            console.info('Clipping Render Executed: ' + __params.o)
            if (__params.o == clippingPlaneConfig.orientation.Horizontal) {
                _plane.renderHorizontalHelper();
            }

            if (__params.o == clippingPlaneConfig.orientation.Vertical) {
                _plane.renderVerticalHelper();
            }

            if (_plane.helper_plane != null) {
                app.renderer.localClippingEnabled = true;
                app.renderer.clippingPlanes = [ this.cut_plane ];
                _plane.alignCutPlane();
                _plane.getHelper().updateMatrixWorld();
                app.render();

                console.info("Plane render() executed")
            }
        }

        this.getHelper = function() {
            if (_plane.helper_plane === null) {
                _plane.render()
            }

            return _plane.helper_plane;
        }

        this.helperMaterialOptions = function() {
            return {
                color: "#f54927",
                transparent: false,
                opacity: .4,
                wireframe: true
            }
        }

        this.renderHorizontalHelper = function() {
            let p = scene.userData;

            var material = new THREE.MeshLambertMaterial(_plane.helperMaterialOptions());
            if (!Q3D.isIE) material.side = THREE.DoubleSide;

            var geometry = new THREE.PlaneBufferGeometry(p.baseExtent.width, p.baseExtent.height, 1, 1);

            _plane.helper_plane = new THREE.Mesh(geometry, material);
            _plane.helper_plane.rotation.z = p.baseExtent.rotation * Q3D.deg2rad;
            _plane.helper_plane.position.z = _this.getAxisValues('z').mid * p.zScale;
            scene.add(_plane.helper_plane);

            __params.d = _plane.helper_plane.position.z;
        }

        this.renderVerticalHelper = function() {
            let p = scene.userData;

            var material = new THREE.MeshLambertMaterial(_plane.helperMaterialOptions());
            if (!Q3D.isIE) material.side = THREE.DoubleSide;

            var geometry = new THREE.PlaneBufferGeometry(p.baseExtent.width, p.baseExtent.height, 1, 1);

            _plane.helper_plane = new THREE.Mesh(geometry, material);

			__params.vector_z = -1;	
            _plane.helper_plane.position.z = _this.getAxisValues('z').min * p.zScale
            _plane.helper_plane.rotation.x = Math.PI / 2;
            _plane.helper_plane.rotation.y = -(Math.PI / 2);
            scene.add(_plane.helper_plane);

            console.log(_this.getAxisValues('x').min);

            __params.d = _plane.helper_plane.position.x;
        }

        this.alignCutPlane = function() {
            normal.set(0, 0, __params.vector_z).applyQuaternion(_plane.getHelper().quaternion);
            point.copy(_plane.getHelper().position);
            _plane.cut_plane.setFromNormalAndCoplanarPoint(normal, point);
        }

        this.remove = function() {
            console.info('Clipping Cleanup Executed')
            if (_plane.helper_plane != null) {
                scene.remove(_plane.helper_plane);
                _plane.helper_plane = null;
            }
            app.renderer.clippingPlanes = [];
            app.render();
        }
    }
};