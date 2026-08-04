
  // Parameters coming from Shiny (might be overwritten)
  // let permeable = {};
  let numberOfMolecules = 50;
  let numberOfTransporters = 14;
  let transport_type = "Diffusie";
  let molecule_type = ["Glucose"];
  
  let membrane_thickness = 8;
  
  // store all molecules
  let molecules = [];
  let transporters = [];
  
  
  // check transporter availability
function canPassTransporter(molecule, nextX, nextY){

  for(let t of transporters){

    let dx = abs(nextX - t.x);
    let dy = abs(nextY - t.y);

    if(
      dx < 10 && dy < 8
    ){
      return true;
    }

  }

  return false;

}
  
  let moleculeProperties = {
  "Glucose": {
    color: "#17A621",
    permeable: false
    
  },

  "Kalium": {
    color: "#FFDB58",
    permeable: false
  },

  "Natrium": {
    color: "#FFA200",
    permeable: false
  }

};

let transporterProperties = {
  "Transporter": {
    present: true
  }
}

// Receive updates from the R sliders
Shiny.addCustomMessageHandler(

  "parameters",

  function(message){

    if(message.molecule_type == null){
      return;
    }

    let new_types = message.molecule_type;

    if(!Array.isArray(new_types)){
      new_types = [new_types];
    }

    // Update permeability of every molecule type
    for(const type in moleculeProperties){

      if(message.permeable.hasOwnProperty(type)){

        moleculeProperties[type].permeable =
          message.permeable[type];

      }

    }
    
    

    // recreate molecules if the population changes
    if(
      message.n !== numberOfMolecules ||
      JSON.stringify(new_types) !== JSON.stringify(molecule_type)
    ){

      numberOfMolecules = message.n;
      molecule_type = new_types;

      createMolecules();

    }
    
    if(message.transport_type != transport_type){

    transport_type = message.transport_type;

    if(transport_type != "Diffusie"){
        createTransporters();
    }

}

  }

);
    

// initiate molecules
function createMolecules(){

  molecules = [];

  if(molecule_type.length === 0){
    return;
  }
  // How many molecules of each type?
  let amount_per_type =
    Math.floor(numberOfMolecules / molecule_type.length);


  let remainder =
    numberOfMolecules % molecule_type.length;


  let counter = 0;


  for(let type of molecule_type){


    let amount = amount_per_type;


    // distribute leftovers
    if(remainder > 0){

      amount += 1;
      remainder -= 1;

    }


    for(let i=0;i<amount;i++){


      let x;


      // Half initially on each side
      if(counter < numberOfMolecules/2){

        x = random(20,190);

      } else {

        x = random(210,380);

      }


    molecules.push({

    x: x,
    y: random(20,380),

    molecule_type: type,

    vx: random(-1,1),
    vy: random(-1,1),

    transporting: false,
    targetTransporter: null

    });


      counter++;

    }

  }

}


// initiate transporters
function createTransporters(){

  transporters = [];
  
  for(let i=0;i<numberOfTransporters;i++){


  let x = width/2
  let spacing = height/(numberOfTransporters+1);
  let y = spacing*(i+1);

  transporters.push({

    id: i,

    x: width/2,
    y: spacing*(i+1),

    occupied: false,

    transporterType: "GLUT",

    occupiedBy: null

});

  }
}
  
    // p5.js setup()
  // Runs once
    
    function setup(){
      
      // Create pixel canvas
      let canvas = createCanvas(400,400);
      
      // Put the canvas inside the div
      canvas.parent("canvas_container");
    
      
      
      createMolecules();
      createTransporters(); // always created, not always drawn
      
    }
  

  // Draw the cell border
  function drawCell(){

    strokeWeight(2);
    noFill();
    rect(0,0,width,height);
  }
  
  // Draw the membrane
  function drawMembrane(){
      stroke(40);
      strokeWeight(membrane_thickness);
      line(width/2,0,width/2,height);
  }
  
  // Draw every molecule
  function drawMolecules(){
      noStroke();
      for(let m of molecules){
          fill(moleculeProperties[m.molecule_type].color);
        circle(m.x,m.y,8);
      }
      fill(0);
  }
  
    // Draw every transporter
function drawTransporters(){

    rectMode(CENTER);

    noStroke();
    fill("#7A3DB8");

    for(let t of transporters){

        rect(
            t.x,
            t.y,
            20,
            16,
            5
        );

    }

}
      
// Update molecules according to Brownian motion
function updateMolecules(){

  for(let m of molecules){

    // Brownian motion
    m.vx += random(-0.2,0.2);
    m.vy += random(-0.2,0.2);

    // limit speed
    m.vx = constrain(m.vx,-2,2);
    m.vy = constrain(m.vy,-2,2);


    let nextX = m.x + m.vx;
    let nextY = m.y + m.vy;


    // walls
    if(nextX < 5 || nextX > 395){
      m.vx *= -1;
      nextX = m.x + m.vx;
    }

    if(nextY < 5 || nextY > 395){
      m.vy *= -1;
      nextY = m.y + m.vy;
    }


    let crossingMembrane =
      (
        (m.x < width/2 && nextX >= width/2 - membrane_thickness/2) ||
        (m.x > width/2 && nextX <= width/2 + membrane_thickness/2)
      );


    if(crossingMembrane){

      let allowed = false;


      // passive diffusion
      if(
        transport_type == "Diffusie" &&
        moleculeProperties[m.molecule_type].permeable
      ){
        allowed = true;
      }


      // transporter route
      if( transport_type != "Diffusie" && 
      canPassTransporter(m, nextX, nextY)
        ){
        allowed = true;
      }


      if(!allowed){

        // bounce
        m.vx *= -1;
        nextX = m.x + m.vx;

      }

    }


    m.x = nextX;
    m.y = nextY;

  }

}
  // Runs 60 times per second
    
    function draw(){
      
      background(235);
      
      drawCell();
      
      drawMembrane();
      
      updateMolecules();
      
      drawMolecules();
      if(transport_type != "Diffusie"){
        drawTransporters();
      }
    }
    