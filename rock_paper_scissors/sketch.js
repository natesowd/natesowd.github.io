// KNN Classification
// A Beginner's Guide to Machine Learning with ml5.js
// The Coding Train / Daniel Shiffman
// 1: https://youtu.be/KTNqXwkLuM4
// 2: https://youtu.be/Mwo5_bUVhlA
// 3: https://youtu.be/JWsKay58Z2g
// https://thecodingtrain.com/learning/ml5/4.1-ml5-save-load-model.html
// https://editor.p5js.org/codingtrain/sketches/RERqlwJL

//
//init global variables: most are global just by nature of p5.js
//

//ml5.js variables
let knn;
let features;

//p5.element variables 
let rock;
let paper;
let scissors; 
let bot;
let player;
let labelP;
let train_div;
let rock_div;
let paper_div;
let scissors_div;
let rock_button;
let paper_button;
let scissors_button;
let model_ready = false;
let video_ready = false;
let playing = false;
let paused = false;
let test_label = "nothing"; 
let reset;
let play;
let collect;
let timer;
let instructions;
let ai_move;
let bot_move;
let video;
let winner;
let bot_moves = ['rock', 'paper', 'scissors'];
let acc_dict = {};
let emoji_dict = {};
let selected_button;
let random_move;
let buttonPressed = false;
let counting = false;
let win_matrix = {
  'rock': {'rock': 0, 'paper': -1, 'scissors': 1},
  'paper': {'rock': 1, 'paper': 0, 'scissors': -1},
  'scissors': {'rock': -1, 'paper': 1, 'scissors': 0}
}
//run iff video component has loaded
function videoReady() {
  video.size(320, 240);
  video_ready = true;
}


//setup function: automatically is run once immediately when page is loaded
function setup() {
  noCanvas();
  
  //divs are generally intialized hierarchically, from top to bottom
  let app = createDiv('');
  app.class('app');

  //start init battleground and children
  battleground = createDiv('');
  battleground.class('battleground');

  let winner_div = createDiv('');
  winner_div.class('winner');
  winner = createP(' ');
  winner.class('big-text');
  winner_div.child(winner);
  
  player = createDiv('');
  player.class('competitor-div');
  let player_header = createP('Player');
  player_header.class('big-text');
  video = createCapture(VIDEO, videoReady);
  video.style('transform', 'scaleX(-1)');
  features = ml5.featureExtractor("MobileNet");
  knn = ml5.KNNClassifier();
  labelP = createP("Need training data");
  labelP.class("big-text");
  player.child(player_header);
  player.child(video);
  player.child(labelP);

  let bot_header = createP('Computer');
  bot_header.class('big-text');
  let bot_img = createImg('images/robot.png');
  bot_move = createP('');
  bot_move.class('big-text');
  bot = createDiv('');
  bot.class('competitor-div');
  bot.child(bot_header);
  bot.child(bot_img);
  bot.child(bot_move);

  battleground.child(player);
  battleground.child(winner_div);
  battleground.child(bot);
  //end init battleground and children


  // start init settings & training
  train_div = createDiv('');
  train_div.class('train');
  instructions = createP("Select a class and hold the Space bar to begin training.");
  
  rock_button = createDiv('');
  paper_button = createDiv('');
  scissors_button = createDiv('');
  rock_button.class('class_div');
  paper_button.class('class_div');
  scissors_button.class('class_div');
  rock = createP();
  paper = createP();
  scissors = createP();
  rock.class('label');
  paper.class('label');
  scissors.class('label');
  rock_button.child(rock);
  paper_button.child(paper);
  scissors_button.child(scissors);

  let settings = createDiv('');
  reset = createButton("Reset class");
  play = createButton("Play");
  collect = createButton("Train");
  play.class('button');
  reset.class('button');
  collect.class('button');
  collect.id('collect');
  settings.child(play);
  settings.child(reset);
  settings.class('settings');

  train_div.child(instructions);
  train_div.child(settings);
  train_div.child(rock_button);
  train_div.child(paper_button);
  train_div.child(scissors_button);
  train_div.child(collect);
  // end init settings & training

  app.child(train_div);
  app.child(battleground);

  //init dictionaries
  rock_button.id('rock');
  paper_button.id('paper');
  scissors_button.id('scissors');
  rock.html('Rock ✊');
  paper.html('Paper ✋');
  scissors.html('Scissors ✌️');
  emoji_dict[rock_button.id()] = '✊';
  emoji_dict[paper_button.id()] = "✋";
  emoji_dict[scissors_button.id()] = '✌️';


  //init button_clicked event for classes
  let classes = [rock_button, paper_button, scissors_button];
  for (let i = 0; i < classes.length; i++) {
    let this_button = classes[i];
    acc_dict[this_button.id()] = 0;
    // console.log('init ' + this_button +' accumulator');

    this_button.mouseClicked(() =>  {
      // change old selected button back to defaults
      if (selected_button) {
        selected_button.style('background-color', color(220));
        selected_button.style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.4)');
      }
      // set new selected button to pressed style
      selected_button = this_button;
      selected_button.style('background-color', color('#cdcdcd'));
      selected_button.style('box-shadow', 'inset 0 0 5px rgba(0, 0, 0, 0.4)');

    });
    // console.log('init ' + this_button +' clicker');

  }

  // ```touch and click support```
  collect.mousePressed(startFunction);
  collect.mouseReleased(stopFunction);
  collect.touchStarted(startFunction);
  collect.touchEnded(stopFunction);

  //init reset button event
  reset.mouseClicked(() => {
    if (selected_button){
      knn.clearLabel(selected_button.id());
      acc_dict[selected_button.id()] = 0;
      instructions.html("Select a class and hold the Space bar to begin training.");
      reset.elt.blur();
      model_ready = false;
      paused = false;
      winner.style('visibility', 'hidden');
    }
  });
  
  //init play button event
  play.mouseClicked(() => {
    goPlay();
  });
}
// end setup function

//init training bars as separate instances of canvas elements (see p5.js documentation for more info)
let canvas_width = 450;
let canvas_height = 60;
let text_height = 40
let text_width = 140;
// init rock frame count
let rock_sketch = function(p) {
  let canvas;
  let run_me;
  p.setup = function() {
    // p.background('#f0f0f0');
    canvas = p.createCanvas(canvas_width, canvas_height);
    // console.log(p.rock_button);
    // canvas.parent(rock_button);
    // console.log(document.getElementById('collect'));
    // canvas.parent('rock');
    run_me = true;
    p.background(255);
    p.textSize(24);
    p.fill(0);
    p.text('0 frames collected', text_width, text_height); // Adjusted Y-coordinate
  };
  //draw rock frame count
  p.draw = function() {
    if (run_me) {
      canvas.parent(rock_button);
      run_me = false;
      //console.log('adding canvas to rock parent');
    }
    if (selected_button == rock_button) {
      p.background(255);
      // Calculate the width of the bar based on the accumulator value
      let barWidth = p.map(acc_dict['rock'], 0, 100, 0, p.width);
  
      // Interpolate the color from red to gree
      let barColor = p.lerpColor(p.color('red'), p.color('#0f0'), acc_dict['rock'] / 100);
       
      // Draw the bar
       p.fill(barColor);
       p.rect(0, 0, barWidth, 100);
  
       p.textSize(24);
       p.fill(0);
       p.text(acc_dict['rock'] + ' frames collected', text_width, text_height); // Adjusted Y-coordinate
    }
  };
};
//init paper frame count
let paper_sketch = function(p) {
  let canvas;
  let run_me;
  p.setup = function() {
    //p.background(220);
    canvas = p.createCanvas(canvas_width, canvas_height);
    p.background(255);
    p.textSize(24);
    p.fill(0);
    run_me = true
    p.text('0 frames collected', text_width, text_height); // Adjusted Y-coordinate
  };
  //draw paper frame count
  p.draw = function() {
    if (run_me) {
      canvas.parent(paper_button);
      run_me = false;
    }
    if (selected_button == paper_button) {
      p.background(255);
      // Calculate the width of the bar based on the accumulator value
      let barWidth = p.map(acc_dict['paper'], 0, 100, 0, p.width);
  
      // Interpolate the color from red to gree
      let barColor = p.lerpColor(p.color('red'), p.color('#0f0'), acc_dict['paper'] / 100);
       
      // Draw the bar
       p.fill(barColor);
       p.rect(0, 0, barWidth, 100);
  
       p.textSize(24);
       p.fill(0);
       p.text(acc_dict['paper'] + ' frames collected', text_width, text_height); // Adjusted Y-coordinate
    }
  };
};
// init scissors frame count
let scissors_sketch = function(p) {
  let canvas;
  let run_me;
  p.setup = function() {
    //p.background(220);
    canvas = p.createCanvas(canvas_width, canvas_height);
    p.background(255);
    p.textSize(24);
    p.fill(0);
    run_me = true;
    p.text('0 frames collected', text_width, text_height); // Adjusted Y-coordinate
  };

  //draw scissors frame count
  p.draw = function() {
    if (run_me) {
      canvas.parent(scissors_button);
      run_me = false;
    }
    if (selected_button == scissors_button) {
      p.background(255);
      // Calculate the width of the bar based on the accumulator value
      let barWidth = p.map(acc_dict['scissors'], 0, 100, 0, p.width);
  
      // Interpolate the color from red to gree
      let barColor = p.lerpColor(p.color('red'), p.color('#0f0'), acc_dict['scissors'] / 100);
       
      // Draw the bar
       p.fill(barColor);
       p.rect(0, 0, barWidth, 100);
  
       p.textSize(24);
       p.fill(0);
       p.text(acc_dict['scissors'] + ' frames collected', text_width, text_height); // Adjusted Y-coordinate
    }
  };
};

//instantiate all canvases so they actually run
let rock_canvas = new p5(rock_sketch);
let paper_canvas =  new p5(paper_sketch);
let scissors_canvas = new p5(scissors_sketch);

//called when collect button is pressed/released, respectively
function startFunction() {
  buttonPressed = true;
}

function stopFunction() {
  buttonPressed = false;
}

//classify collected photos and generate model
function goClassify() {
  const logits = features.infer(video);
  knn.classify(logits, function (error, result) {
    if (error) {
      console.error(error);
    } else if (!paused) {
      test_label = result.label;
      labelP.html(emoji_dict[result.label]);
      goClassify();
    }
  });
}

//play a round vs. AI
function goPlay() {
  if (!model_ready) {
    instructions.html('You must train a class to being playing!');
  } else {    
    timer = 3; //countdown in seconds
    paused = false; //begin classifying again if paused
    model_ready = false; 
    playing = true; //starts countdown in draw()
    //roll_acc = 0;
  }
}

// counts down to zero from timer value (idk how it works but it does)
function countdown() {
  if (frameCount % 60 != 0) {
    if (counting == false) {
      winner.style('visibility', 'hidden');
      return;
    }
  }

  if (counting == false) {
    counting = true;
    winner.style('visibility', 'visible');
  }
  // console.log('continuing anyway!');
  if (frameCount % 5 == 0) rollAI(); //change AI move
  if (frameCount % 60 == 59) {
    if (timer > 0) timer--;
    if (timer == 0) {
      playing = false;
      paused = true;
      counting = false;
      //randomly select AI move
      ai_move = bot_moves[Math.floor(Math.random() * bot_moves.length)]; 
      bot_move.html(emoji_dict[ai_move]);
      findWinner();
    }
  }
}

//determine winner using win_matrix
function findWinner() {
  if (win_matrix[test_label][ai_move] > 0) winner.html("Player's " + test_label + " beats Computers's " + ai_move + '. you win!');
  else if (win_matrix[test_label][ai_move] < 0) winner.html("Computers's " + ai_move + " beats Player's " + test_label + '. you lose!');
  else (winner.html('Player and Computer both threw ' + test_label + '. It\'s a tie!'));
}

//iterates through AI possible moves
function rollAI() {
  bot_move.html(emoji_dict[bot_moves[frameCount % 3]]);
}

//add image to class training data
function train(button) {
  if (acc_dict[button.id()] < 100) {
    const logits = features.infer(video);
    knn.addExample(logits, button.id());
    acc_dict[button.id()]++;
  }
}


// function modelReady() {
//   console.log("model ready to be trained!");
//   // Comment back in to load your own model!
//   // knn.load('model.json', function() {
//   //   console.log('knn loaded');
//   // });
// }

// draw is called everyframe after setup()-- 60 frames per second(!)
function draw() {
  
  //add image to training data if model is ready and space bar is being held (buttonPressed is not currently implemented)
  if (selected_button && video_ready) {
    if (keyIsDown(32) || buttonPressed) {
      //console.log('training ' + selected_button.id);
      train(selected_button);
    }
  }

  //create new classsification every frame in which there exists at least one class with data
  if (!model_ready && knn.getNumLabels() > 0) {
    goClassify();
    model_ready = true;
  }

  //runs while a round is active
  if (playing) {
    winner.html(timer);
    instructions.html("Capturing in " + timer + " seconds...");
    countdown();
  } else if (acc_dict[rock_button.id()] == 100 && acc_dict[paper_button.id()] == 100 && acc_dict[scissors_button.id()] == 100) {
    instructions.html('Click Play and hold up a move!');
  }
}
