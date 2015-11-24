(function() {
    var scene, camera, renderer;
    var floorGrid;
    var segments = [];
    var houses = [];
    var clouds = [];

    SPEED = 10;

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
        camera.position.y = 400;
        camera.position.z = 1000;

        floorGrid = basicFloorGrid(100000, 0, 500, '#CE9668');
        scene.add(floorGrid);

        NUM_HOUSES = 20;
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
                min: -1000,
                max: 1000
            })
            house.position.z += chance.floating({
                min: -1000,
                max: 1000
            })

            house.userData.colliding = false;
            house.userData.added = false;
            houses.push(house);
            scene.add(house);
        }

        // Create tornado:
        NUM_SEGMENTS = 300
        SEGMENT_HEIGHT = 5
        TORNADO_WIDTH = 5
        for (var i = 0; i < NUM_SEGMENTS; i++) {
            var segment = new THREE.Object3D();
            var geometry = new THREE.TorusGeometry((NUM_SEGMENTS * TORNADO_WIDTH) - (i * TORNADO_WIDTH), SEGMENT_HEIGHT, 4, 7);
            var material = new THREE.MeshBasicMaterial({
                color: '#14223E',
                wireframe: true
            });
            var mesh = new THREE.Mesh(geometry, material);
            segment.add(mesh);

            segment.rotation.x = Math.PI / 2;
            segment.position.y = -(i * SEGMENT_HEIGHT * 2) + (NUM_SEGMENTS * SEGMENT_HEIGHT * 2);
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
                }), 10, 10);
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
                min: -15000,
                max: 15000
            })
            cloud.position.y = chance.floating({
                min: 2000,
                max: 6000
            });
            cloud.position.z = -8000
            clouds.push(cloud);
            scene.add(cloud);
        }

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor('#0E0E0E', 1);

        camera.lookAt(
            new THREE.Vector3(0, 0, 0)
        );

        document.body.appendChild(renderer.domElement);
    }


    var cameraSpeed = 1;
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
                    child.position.y += .4;
                    if (chance.bool({
                            likelihood: 10
                        })) {
                        // if (child.position.z < 0)
                        //     child.position.z += .1;
                        // child.position.z = 0
                        segment.add(child);
                    }
                }
            }
        }

        // Move bottom segment of tornado:
        var bottomSegment = segments[segments.length - 1];
        var direction = new THREE.Vector3(0, 0, 0)
        if (Key.any()) {
            if (Key.isDown(Key.RIGHT)) {
                direction.x += 1;
            }

            if (Key.isDown(Key.LEFT)) {
                direction.x -= 1;
            }

            if (Key.isDown(Key.UP)) {
                direction.z -= 1;
            }

            if (Key.isDown(Key.DOWN)) {
                direction.z += 1;
            }

            bottomSegment.position.add(direction.normalize().multiplyScalar(SPEED));
        } else {

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
        }

        for (var i = 0; i < clouds.length; i++) {
            var cloud = clouds[i];
            cloud.position.x += 3;
        }

        camera.position.z -= cameraSpeed;

        renderer.render(scene, camera);
    }

    init();
    animate();
})();
