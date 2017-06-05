const ctn = document.querySelector('#canvasCtn');
const ctn_style = window.getComputedStyle(ctn);

const canvasEl = document.createElement('canvas');
canvasEl.id = 'canvas';

ctn.appendChild(canvasEl);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");

canvas.width = parseInt(ctn_style.getPropertyValue('width'));
canvas.height = parseInt(ctn_style.getPropertyValue('height'));

let canvasSide = (canvas.height < canvas.width) ? canvas.height : canvas.width;
let squareSide = Math.sqrt(Math.pow(canvasSide,2)/2) * 0.5;
let squareOffset = (canvasSide - squareSide)/2;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.translate((canvas.width - canvasSide)/2, 0);

let n = 0;

let trail = [];
let rotateSquare

function rotate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let opacity = 1;
  if (trail.length < 6) {
    for ( let i = 0; i < trail.length; i++){
      opacity -= 0.2;
      ctx.strokeStyle = "rgba(225,0,0,"+opacity+")";
      renderSquare(trail[i]);
    }
  } else {
    for ( let i = 0; i < 6; i++){
      opacity -= 0.2;
      ctx.strokeStyle = "rgba(225,0,0,"+opacity+")";
      renderSquare(trail[i]);
    }
  }

  // square
  ctx.strokeStyle = "rgba(225,0,0,1)";
  renderSquare(n);

  if (n%2 === 0){
    trail.unshift(n);
  }

  n++;

  // rotateSquare = requestAnimationFrame(rotate);
}

function rotateReverse() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let opacity = 1;
  if (trail.length < 6) {
    for ( let i = 0; i < trail.length; i++){
      opacity -= 0.2;
      ctx.strokeStyle = "rgba(225,0,0,"+opacity+")";
      renderSquare(trail[i]);
    }
  } else {
    for ( let i = 0; i < 6; i++){
      opacity -= 0.2;
      ctx.strokeStyle = "rgba(225,0,0,"+opacity+")";
      renderSquare(trail[i]);
    }
  }

  // square
  ctx.strokeStyle = "rgba(225,0,0,1)";
  renderSquare(n);

  if (n%2 === 0){
    trail.unshift(n);
  }

  n--;

  // rotateSquare = requestAnimationFrame(rotateReverse);
}

let directionForward = true;
let forward = setInterval(rotate, 1000/60);
let reverse;


canvasEl.addEventListener('click', ()=>{
  if(directionForward) {
    directionForward = !directionForward;
    clearInterval(forward);
    clearInterval(reverse);
    reverse = setInterval(rotateReverse, 1000/60);
  } else {
    directionForward = !directionForward;
    clearInterval(reverse);
    clearInterval(forward);
    forward = setInterval(rotate, 1000/60);
  }
});

canvasEl.addEventListener('mousemove',function(e){
  var y = ((e.clientX - (canvas.width / 2)) / (canvas.width / 2)) * 45;
  var x = ((e.clientY - (canvas.height / 2)) / (canvas.height / 2)) * 45;
  // canvasEl.setAttribute('style','transform:  rotateY('+( x * 30 )+'deg) rotateX('+( y * 30 )+'deg)');
  TweenLite.to(canvasEl, 1, {rotationY: y ,rotationX: x});
});

canvasEl.addEventListener('mouseleave',function(e){
  TweenLite.to(canvasEl, 2, {rotationY: 0 ,rotationX: 0});
})

function renderSquare(d) {
  ctx.save();
  ctx.translate(canvasSide/2, canvasSide/2);
  ctx.rotate(d * Math.PI / 180);
  ctx.translate(-canvasSide/2, -canvasSide/2);
  ctx.strokeRect(squareOffset, squareOffset, squareSide, squareSide);
  ctx.restore();
}

function throttle (callback, limit) {
    var wait = false;                 // Initially, we're not waiting
    return function () {              // We return a throttled function
        if (!wait) {                  // If we're not waiting
            callback.call();          // Execute users function
            wait = true;              // Prevent future invocations
            setTimeout(function () {  // After a period of time
                wait = false;         // And allow future invocations
            }, limit);
        }
    }
}
