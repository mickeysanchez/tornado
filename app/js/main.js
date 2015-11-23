(function() {
    var scene, camera, renderer;
    var floorGrid;
    var segments = [];
    var houses = [];
    var clouds = [];
    var raindrops = [];

    SPEED = 10;
    PAN_SPEED = 2;
    TOTAL_PAN = 0;

    var Key = {
        _pressed: {},

        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,

        isDown: function(keyCode) {
            return this._pressed[keyCode];
        },

        any: function() {
            return Object.keys(this._pressed).length > 0;
        },

        onKeydown: function(event) {
            this._pressed[event.keyCode] = true;
        },

        onKeyup: function(event) {
            delete this._pressed[event.keyCode];
        }
    };

    window.addEventListener('keyup', function(event) {
        Key.onKeyup(event);
    }, false);

    window.addEventListener('keydown', function(event) {
        Key.onKeydown(event);
        hideMenu();
    }, false);

    function hideMenu() {
        var menu = document.getElementById('overlay');
        menu.style.display = 'none';
    }

    function basicFloorGrid(linesWidth, linesHeight, steps, gridColor) {
        steps = steps || 2;
        gridColor = gridColor || 0xFFFFFF;
        var floorGrid = new THREE.Geometry();
        var gridLine = new THREE.LineBasicMaterial({
            color: gridColor
        });
        for (var i = -linesWidth; i <= linesWidth; i += steps) {
            floorGrid.vertices.push(new THREE.Vector3(-linesWidth, 0, i));
            floorGrid.vertices.push(new THREE.Vector3(linesWidth, 0, i));
        }
        for (var i = -linesHeight; i <= linesHeight; i += steps) {
            floorGrid.vertices.push(new THREE.Vector3(i, 0, -linesHeight));
            floorGrid.vertices.push(new THREE.Vector3(i, 0, linesHeight));
        }
        return new THREE.Line(floorGrid, gridLine, THREE.LinePieces);
    }

    function init() {

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 10000);
        // camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 100000)
        camera.position.y = 400;
        camera.position.z = 1000;

        floorGrid = basicFloorGrid(30000, 0, 500, '#CE9668');
        scene.add(floorGrid);

        NUM_HOUSES = 100;
        for (var i = 0; i < NUM_HOUSES; i++) {
            var house = new THREE.Object3D();
            var geometry = new THREE.BoxGeometry(30, 30, 30, 1, 1, 1);
            var material = new THREE.MeshBasicMaterial({
                color: '#B2423F',
                wireframe: true
            });
            var cube = new THREE.Mesh(geometry, material);
            house.add(cube);

            house.rotation.y = Math.PI / chance.floating({
                min: 3,
                max: 5
            });
            house.position.y = 40;
            house.position.x += chance.floating({
                min: -6000,
                max: 6000
            })
            house.position.z += chance.floating({
                min: -10000,
                max: 1000
            })

            house.userData.colliding = false;
            house.userData.added = false;
            houses.push(house);
            scene.add(house);
        }

        // Create tornado:
        NUM_SEGMENTS = 80
        for (var i = 0; i < NUM_SEGMENTS; i++) {
            var segment = new THREE.Object3D();
            var geometry = new THREE.TorusGeometry((NUM_SEGMENTS * 10) - (i * 10), 16, 4, 7);
            var material = new THREE.MeshBasicMaterial({
                color: '#14223E',
                wireframe: true
            });
            var mesh = new THREE.Mesh(geometry, material);
            segment.add(mesh);

            segment.rotation.x = Math.PI / 2;
            segment.position.y = -(i * 35) + (NUM_SEGMENTS * 35);
            segment.position.z -= 2000;
            segment.position.x -= 1500;
            segment.userData.spinSpeed = chance.floating({
                min: 0.05,
                max: 0.12
            });
            segment.userData.vel = 0;
            segment.userData.direction = new THREE.Vector3(0, 0, 0);
            segments.push(segment);
            scene.add(segment);
        }

        // Create clouds:
        NUM_CLOUDS = 20;
        for (var i = 0; i < NUM_CLOUDS; i++) {
            var cloud = new THREE.Object3D();
            var randCloudBubs = chance.integer({
                min: 6,
                max: 9
            });
            for (var j = 0; j < randCloudBubs; j++) {
                var geometry = new THREE.SphereGeometry(chance.floating({
                    min: 300,
                    max: 600
                }), 6, 6);
                var material = new THREE.MeshBasicMaterial({
                    color: '#444'
                });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = chance.floating({
                    min: -600,
                    max: 600
                })
                mesh.position.y = chance.floating({
                    min: -600,
                    max: 600
                })
                mesh.position.z = chance.floating({
                    min: -600,
                    max: 600
                })
                cloud.add(mesh);
            }
            cloud.position.x = chance.floating({
                min: -20000,
                max: 20000
            })
            cloud.position.y = chance.floating({
                min: 2000,
                max: 6000
            });
            cloud.position.z = -8000
            clouds.push(cloud);
            scene.add(cloud);
        }

        // RAIN
        RAIN_DROP_NUM = 1000;
        for (var i = 0; i < RAIN_DROP_NUM; i++) {
            var geometry = new THREE.PlaneGeometry(5, 20, 32);
            var material = new THREE.MeshBasicMaterial({
                color: '#3B63B5',
                side: THREE.DoubleSide
            });
            var plane = new THREE.Mesh(geometry, material);
            plane.position.x = chance.floating({
                min: -10000,
                max: 10000
            })
            plane.position.y = chance.floating({
                min: -1000,
                max: 2000
            })
            plane.position.z = chance.floating({
                min: -10000,
                max: 1000
            })
            scene.add(plane);
            raindrops.push(plane);
        }

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor('#0E0E0E', 1);

        camera.lookAt(
            new THREE.Vector3(0, 0, 0)
        );

        document.body.appendChild(renderer.domElement);

        i = document.getElementsByTagName('body')[0]
        i.addEventListener('click', function() {
            // go full-screen
            if (i.requestFullscreen) {
                i.requestFullscreen();
            } else if (i.webkitRequestFullscreen) {
                i.webkitRequestFullscreen();
            } else if (i.mozRequestFullScreen) {
                i.mozRequestFullScreen();
            } else if (i.msRequestFullscreen) {
                i.msRequestFullscreen();
            }
        });
    }

    SUCK_SPEED = .3;
    var lastDirection = new THREE.Vector3(0, 0, 0);

    function animate() {

        requestAnimationFrame(animate);

        // Move each tornado section:
        for (var i = 0; i < segments.length; i++) {

            var segment = segments[i];
            segment.rotation.z += segment.userData.spinSpeed;

            if (i + 1 < segments.length) {
                // Each segment follows the one beneath it.
                var segmentBeneath = segments[i + 1];
                var xDiff = segmentBeneath.position.x - segment.position.x;
                var zDiff = segmentBeneath.position.z - segment.position.z;
                var diff = new THREE.Vector3(xDiff, 0, zDiff);
                // Pythangorean theorem bitches:
                var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(zDiff, 2));
                if (Math.abs(distance) > 10) {
                    segment.userData.direction = diff.normalize();
                    if (segment.userData.vel < SPEED)
                        segment.userData.vel += .7;
                    segment.position.add(segment.userData.direction.multiplyScalar(segment.userData.vel));
                } else {
                    if (segment.userData.vel > 0)
                        segment.userData.vel -= .4;
                    segment.position.add(segment.userData.direction.multiplyScalar(SPEED / 13));
                }

                for (var j = 1; j < segmentBeneath.children.length; j++) {
                    var child = segmentBeneath.children[j];
                    if (child.position.z >= -35) {
                        if (child.position.z - SUCK_SPEED > -35) {
                            child.position.z = -35;
                        } else {
                            child.position.z -= SUCK_SPEED;
                        }
                    } else {
                        if (chance.bool({
                                likelihood: 90
                            })) {
                            child.position.y += 2;
                            child.position.z = 0;
                            segment.add(child);
                        }
                    }
                }
            }
        }

        // Move bottom segment of tornado:
        var bottomSegment = segments[segments.length - 1];

        camera.updateMatrix(); // make sure camera's local matrix is updated
        camera.updateMatrixWorld(); // make sure camera's world matrix is updated
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        bottomSegment.updateMatrix(); // make sure plane's local matrix is updated
        bottomSegment.updateMatrixWorld(); // make sure plane's world matrix is updated
        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

        var direction = new THREE.Vector3(0, 0, 0);
        if (Key.any()) {
            if (Key.isDown(Key.RIGHT)) {
                direction.x += 1;
            }

            if (Key.isDown(Key.LEFT)) {
                direction.x -= 1;
            }

            if (Key.isDown(Key.UP)) {
                if (bottomSegment.position.z > -8500)
                    direction.z -= 1;
            }

            if (Key.isDown(Key.DOWN)) {
                if (bottomSegment.position.z < 600)
                    direction.z += 1;
            }

            bottomSegment.position.add(direction.normalize().multiplyScalar(SPEED));
        } else {
            // if (chance.bool({
            //         likelihood: 10
            //     }))
            //     lastDirection = new THREE.Vector3(chance.floating({
            //             min: -1,
            //             max: 1
            //         }),
            //         0,
            //         chance.floating({
            //             min: -1,
            //             max: 1
            //         }))
            // bottomSegment.position.add(lastDirection.normalize().multiplyScalar(SPEED));
        }

        for (var i = 0; i < houses.length; i++) {
            var house = houses[i];
            var xDiff = bottomSegment.position.x - house.position.x;
            var zDiff = bottomSegment.position.z - house.position.z;
            var diff = new THREE.Vector3(xDiff, 0, zDiff);
            var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(zDiff, 2));
            if (distance < 100) {
                house.colliding = true;
            } else {
                house.colliding = false;
            }
            if (house.colliding) {
                house.rotation.z += 1;
                house.rotation.x += 3;
                if (!house.userData.added) {
                    house.userData.added = true;
                    bottomSegment.add(house);
                    house.position.x = 0;
                    house.position.y = 0;
                    house.position.z = 0;
                }
            } else {
                // var fallSpeed = 4;
                // if (house.position.y - fallSpeed > 50) {
                //     house.position.y -= fallSpeed;
                // } else {
                //     house.position.y = 50;
                // }
            }

            house.updateMatrix(); // make sure plane's local matrix is updated
            house.updateMatrixWorld(); // make sure plane's world matrix is updated
            if (!frustum.containsPoint(house.position)) {
                house.position.x += chance.floating({
                    min: -6000 - TOTAL_PAN,
                    max: 6000 - TOTAL_PAN
                })
                house.position.z += chance.floating({
                    min: -10000 - TOTAL_PAN,
                    max: 1000 - TOTAL_PAN
                })
            }
        }

        // CLOUDS
        for (var i = 0; i < clouds.length; i++) {
            var cloud = clouds[i];
            cloud.position.x += chance.floating({
                min: 3,
                max: 10
            });
            if (cloud.position.x > 20000) {
                cloud.position.x = chance.floating({
                    min: -25000,
                    max: -20000
                })
                cloud.position.y = chance.floating({
                    min: 1500,
                    max: 4000
                });
                cloud.position.z -= TOTAL_PAN;
            }
        }

        // RAINDROPS
        for (var i = 0; i < raindrops.length; i++) {
            var raindrop = raindrops[i];
            raindrop.position.y -= 30;
            if (raindrop.position.y < -300) {
                raindrop.position.x = chance.floating({
                    min: -10000,
                    max: 10000
                })
                raindrop.position.y = chance.floating({
                    min: 3000,
                    max: 4500
                });
                raindrop.position.z = chance.floating({
                    min: -10000 - TOTAL_PAN,
                    max: 1000 - TOTAL_PAN
                })
            }
        }

        camera.position.z -= PAN_SPEED;
        TOTAL_PAN += PAN_SPEED;
        camera.position.z -= 1;

        renderer.render(scene, camera);
    }

    init();
    animate();
})();
