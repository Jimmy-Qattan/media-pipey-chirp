import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const scoreCount = document.getElementById("scoreCount");

/* REMEMBER TO ADD COLLIDERS BETWEEN EACH PIPE TO ADD POINTS */

let gameStarted = false;
let loserState = false;
let score = 0;
let timeInGame = 0;

const camera = document.getElementById("camera");

const easeOutQuad = (t) => {
  return t * (2 - t);
};

let pipeList = [];
let pipeHeights = [];

let pipesPassed = {};

function updatePList(pList) {
  pList.length = 0;

  document
    .querySelector("a-scene")
    .querySelectorAll("[pipe]")
    .forEach((pipe) => {
      pList.push(pipe);
    });

  return pList;
}

async function createPipe(
  xVal,
  zVal = -10,
  pList,
  pHeights,
  yOffSet = Math.floor(Math.random() * 30) - 15
) {
  //const randomAmount = yOffSet;

  const pipe = document.createElement("a-entity");

  pipe.id = `pipe${pipeList.length}`;
  const pipe2 = document.createElement("a-entity");

  pipe2.setAttribute("gltf-model", "#pipe");
  pipe2.setAttribute("position", `${xVal} ${120 + yOffSet} ${zVal}`);
  pipe2.setAttribute("rotation", "180 0 0");

  pipe.setAttribute("gltf-model", "#pipe");
  pipe.setAttribute("position", `${xVal} ${yOffSet} ${zVal}`);
  pipe.setAttribute("rotation", "0 0 0");
  //pipeList.push(pipe);
  document.querySelector("a-scene").appendChild(pipe);
  document.querySelector("a-scene").appendChild(pipe2);
  // CREATE COLLIDER FOR POINTS

  const pointBox = document.createElement("a-box");
  pointBox.setAttribute("points", "");
  pointBox.setAttribute("position", `${xVal} ${yOffSet + 60} ${zVal}`);
  pointBox.setAttribute("scale", "3 12 3");
  pointBox.setAttribute("material", "color: red; opacity: 0");
  pointBox.setAttribute("static-body", "");
  document.querySelector("a-scene").appendChild(pointBox);

  const pipePromise = new Promise((resolve) => {
    pipe.addEventListener("model-loaded", function () {
      pipe.setAttribute("pipe", "");
      pipe.setAttribute("static-body", "");
      resolve();
    });
  });
  const pipe2Promise = new Promise((resolve) => {
    pipe2.addEventListener("model-loaded", function () {
      pipe2.setAttribute("pipe", "");
      pipe2.setAttribute("static-body", "");
      resolve();
    });
  });

  const pointBoxPromise = new Promise((resolve) => {
    pointBox.addEventListener("body-loaded", function () {
      pointBox.body.collisionResponse = false;
      resolve();
    });
  });

  pList.push(pipe);
  pHeights.push(yOffSet);

  return Promise.all([pipePromise, pipe2Promise, pointBoxPromise]);
}

AFRAME.registerComponent("points", {
  schema: {
    points: { default: 1 },
  },
  init: function () {
    this.didCollide = false;
    const box = this.el;
    box.addEventListener("collide", (e) => {
      const elHit = e.detail.body?.el;
      if (elHit?.hasAttribute("flappy-bird")) {
        if (this.didCollide) {
          return;
        }
        this.didCollide = true;

        console.log("collided");
        score++;
        scoreCount.setAttribute("value", `${score}`);
        console.log(score);
        // console.log("removing box", box);
        // setTimeout(() => {
        //   box.removeAttribute("static-body");
        //   box.remove();
        // }, 1);
      }
    });
  },
  tick: function () {
    if (this.didCollide) {
      this.el.remove();
    }
  },
});

let lastXPosition;
/**
 * @param {number} numPipes
 * @param {Object[]} listOfPipes
 * @param {number} separation
 * @param {number} xPrev
 */
async function createSeriesOfPipes(
  numPipes,
  listOfPipes,
  separation,
  xPrev = 0
) {
  //updatePList(listOfPipes);
  let finalX;
  const initialNumOfPipes = listOfPipes.length;
  let lastPipeOffSetPrev;
  if (listOfPipes.length > 0) {
    lastPipeOffSetPrev = listOfPipes.at(-1);

    console.log(
      "creating a set from previous Set",
      lastPipeOffSetPrev.object3D.position.x
    );
    let offSet = 0;
    let xOffSet = lastPipeOffSetPrev.object3D.position.x + separation;

    for (let i = 0; i < numPipes; i++) {
      if (i == 0) {
        const newRanNumber = Math.floor(Math.random() * 20) - 10;
        await createPipe(
          xOffSet,
          -10,
          pipeList,
          pipeHeights,
          lastPipeOffSetPrev.object3D.position.y + newRanNumber
        );
        console.log(xOffSet);
        xOffSet += separation;
        offSet = lastPipeOffSetPrev.object3D.position.y + newRanNumber;
      } else {
        const newRanNumber = Math.floor(Math.random() * 20) - 10;
        await createPipe(
          xOffSet /*i * 20 + 15 + 5 * initialNumOfPipes*/,
          -10,
          pipeList,
          pipeHeights,
          offSet + newRanNumber
        );
        console.log(xOffSet);
        xOffSet += separation;
        offSet = offSet + newRanNumber;

        if (i == numPipes - 1) {
          finalX = xOffSet;
        }
      }
    }
  } else {
    let yOffSet = 0;
    let xOffSet = 10;
    for (let i = 0; i < numPipes; i++) {
      const newRanNumber = Math.floor(Math.random() * 20) - 10;
      await createPipe(
        xOffSet,
        -10,
        listOfPipes,
        pipeHeights,
        yOffSet + newRanNumber
      );
      yOffSet = yOffSet + newRanNumber;
      xOffSet += separation;
    }
    finalX = xOffSet;
  }

  return finalX;
}

// FIX DIFFERENCE IN SEPARATION DIFFERENCES!

AFRAME.registerComponent("pipe", {
  schema: {
    pointValue: { default: 1 },
    uniqueID: { default: crypto },
  },
  init: function () {
    function returnUniqueID() {
      return this.data.uniqueID;
    }
  },
});

const createPipes = async () => {
  await createSeriesOfPipes(20, pipeList, 18);
};
createPipes();

console.log(pipeList);

AFRAME.registerComponent("flappy-bird", {
  schema: {
    jumptime: { default: 200 },
    falltime: { default: 1000 },
    jumpangle: { default: 1.3 },
    fallangle: { default: -Math.PI / 2 },
    speed: { default: 2 },
  },
  init: function () {
    this.cameraRig = document.querySelector("#cameraRig");
    console.log("created component");
    this.el.addEventListener("body-loaded", () => {
      this.el.body.fixedRotation = true;
      //this.el.body.angularFactor.set(0, 0, 0);
    });
    this.el.addEventListener("collide", function (e) {
      if (e.detail.body.el) {
        if (e.detail.body.el.hasAttribute("pipe")) {
          console.log("AHAHAHAHAHHA");
          loserState = true;
        }
      }
      //console.log(e.detail.body.el.hasAttribute("points"));
    });
    this.model = this.el.querySelector("[gltf-model]");
    this.lastTimeJumped = 0;

    this.el.addEventListener("jump", () => {
      console.log("jump :)");
      if (gameStarted == false) {
        gameStarted = true;

        this.el.setAttribute("dynamic-body", "shape: sphere; sphereRadius: 2;");
        console.log("Jump!");
        this.lastTimeJumped = Date.now();
        this.jumpZ = this.model.object3D.rotation.z;
        //console.log("jumpZ", this.jumpZ);
        this.el.body.velocity.y = 0;
        let jumpForce = new CANNON.Vec3(0, 40, 0);
        let position = this.el.object3D.position;
        this.el.body.applyImpulse(jumpForce, position);
      } else {
        if (loserState) {
          score = 0;
          scoreCount.value = `0`;
          scoreCount.setAttribute("value", "0");
          console.log("NEOWWWW");
          loserState = false;
          gameStarted = false;
          const body = this.el.body;
          body.position.set(-20, 50, -10);
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          this.model.object3D.rotation.set(0, 0, 0);

          setTimeout(() => {
            this.el.removeAttribute("dynamic-body");
          }, 1);
          //this.el.setAttribute("position", "0 50 -10");
          //this.el.setAttribute("rotation", "0 0 0");

          document
            .querySelector("a-scene")
            .querySelectorAll("[pipe]")
            .forEach((pipe) => {
              pipe.remove();
            });
          document
            .querySelector("a-scene")
            .querySelectorAll("[points]")
            .forEach((point) => {
              point.remove();
            });

          const newPipeList = updatePList(pipeList);

          createSeriesOfPipes(20, newPipeList, 25);
        } else {
          console.log("Jump!");
          this.lastTimeJumped = Date.now();
          this.jumpZ = this.model.object3D.rotation.z;
          //console.log("jumpZ", this.jumpZ);
          this.el.body.velocity.y = 0;
          let jumpForce = new CANNON.Vec3(0, 40, 0);
          let position = this.el.object3D.position;
          this.el.body.applyImpulse(jumpForce, position);
        }
      }
    });
  },
  tick: function (time, timeDelta) {
    if (!this.el.body) {
      return;
    }
    const pos = this.el.object3D;
    const { rotation } = this.model.object3D;

    if (this.el.body) {
      if (gameStarted == true && loserState == false) {
        this.data.speed += 0.01;
        this.el.body.velocity.x = this.data.speed;
      } else {
        this.el.body.velocity.x = 0;
      }
      // Figure out how many pipes the bird is past
    }

    if (this.lastTimeJumped > 0) {
      const timeSinceJump = Date.now() - this.lastTimeJumped;
      //console.log({ timeSinceJump });
      if (timeSinceJump < this.data.jumptime) {
        const interpolation = THREE.MathUtils.inverseLerp(
          0,
          this.data.jumptime,
          timeSinceJump
        );
        const z = THREE.MathUtils.lerp(
          this.jumpZ,
          this.data.jumpangle,
          interpolation
        );
        rotation.z = z;
      } else if (timeSinceJump < this.data.jumptime + this.data.falltime) {
        let interpolation = THREE.MathUtils.inverseLerp(
          this.data.jumptime,
          this.data.jumptime + this.data.falltime,
          timeSinceJump
        );
        interpolation = easeOutQuad(interpolation);
        const z = THREE.MathUtils.lerp(
          this.data.jumpangle,
          this.data.fallangle,
          interpolation
        );
        rotation.z = z;
      }
    }
  },
});

document.addEventListener("keypress", (event) => {
  switch (event.key) {
    case " ":
      //if (loserState == false) {
      bird.emit("jump");
      //}
      break;
  }
});

let currentlyInTap = false;
let currentPos = new THREE.Vector3(0, 20, -5);
let prevPos = new THREE.Vector3(0, 0, 0);

const calibrateButton = document.getElementById("calibrate");
const bird = document.getElementById("bird");
let fingerStretchCal;

function getDist(vec1, vec2) {
  let difX = vec1.x - vec2.x;
  let difY = vec1.y - vec2.y;

  return Math.sqrt(difX ** 2 + difY ** 2);
}

document.querySelector("video").style.visibility = "hidden";

async function start() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  let stream = await navigator?.mediaDevices?.getUserMedia({
    video: true,
  });
  video.srcObject = stream;

  video.addEventListener("loadeddata", () => {
    console.log("Video ready:", video.videoWidth, video.videoHeight);

    function loop() {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestAnimationFrame(loop); // What is this?
        return;
      }

      const results = handLandmarker.detectForVideo(video, performance.now());

      if (results.landmarks.length > 0) {
        const indexTip = results.landmarks[0][20];

        const thumbVector = new Vector(
          results.landmarks[0][4].x,
          results.landmarks[0][4].y
        );
        const pointerVector = new Vector(
          results.landmarks[0][8].x,
          results.landmarks[0][8].y
        );

        const palmVector = new Vector(
          results.landmarks[0][1].x,
          results.landmarks[0][1].y
        );
        const initialVector = new Vector(
          results.landmarks[0][0].x,
          results.landmarks[0][0].y
        );

        let distBetweenThumbandPointer = getDist(thumbVector, pointerVector);

        calibrateButton.addEventListener("click", function () {
          fingerStretchCal = distBetweenThumbandPointer;
          calibrateButton.innerHTML =
            fingerStretchCal + " is the new calibrated value";
        });

        if (distBetweenThumbandPointer <= 0.05) {
          if (currentlyInTap == false) {
            bird.emit("jump");
            currentlyInTap = true;
          }
        } else {
          currentlyInTap = false;
        }
      }

      requestAnimationFrame(loop);
    }

    loop();
  });
}

start();
