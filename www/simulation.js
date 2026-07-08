
  // Parameters coming from Shiny (might be overwritten)
  let permeable = true;
  let numberOfMolecules = 50;
  let transport_type = "Diffusie";
  let molecule_type = ["Glucose"];
  
  // store all molecules
  let molecules = [];
  
  
    // Receive updates from the R sliders
Shiny.addCustomMessageHandler(

"parameters",

function(message){

  console.log(message);

  permeable = message.permeable;
  transport_type = message.transport_type;


  if(message.molecule_type == null){
    return;
  }


  let new_types = message.molecule_type;

  if(!Array.isArray(new_types)){
    new_types = [new_types];
  }


  if(
    message.n !== numberOfMolecules ||
    JSON.stringify(new_types) !== JSON.stringify(molecule_type)
  ){

    numberOfMolecules = message.n;
    molecule_type = new_types;

    createMolecules();

  }

}

);
    
  let molecules_dictionary = {
    "Glucose": "#A8DCAB",
    "Kalium": "#FFDB58",
    "Natrium": "#FFDBBB"
  }

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

        x:x,
        y:random(20,380),

        molecule_type:type,

        vx:random(-1,1),
        vy:random(-1,1)

      });


      counter++;

    }

  }

}
  
    // p5.js setup()
  // Runs once
    
    function setup(){
      
      // Create a 400x400 pixel canvas
      let canvas = createCanvas(400,400);
      
      // Put the canvas inside the div
      canvas.parent("canvas_container");
    
      
      
      createMolecules();
      
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
      strokeWeight(8);
      line(width/2,0,width/2,height);
  }
  
  // Draw every molecule
  function drawMolecules(){
      noStroke();
      for(let m of molecules){
          fill(molecules_dictionary[m.molecule_type]);
        circle(m.x,m.y,8);
      }
  }
      
// Update molecules according to Brownian motion
function updateMolecules(){
  for(let m of molecules){
        // Move molecule
        m.x += m.vx;
        m.y += m.vy;
        
        // Random Brownian motion
        m.vx += random(-0.2,0.2);
        m.vy += random(-0.2,0.2);
        
        // Limit speed
        m.vx = constrain(m.vx,-2,2);
        m.vy = constrain(m.vy,-2,2);
        
        // Bounce off outer walls
        if(m.x<5 || m.x>395)
          m.vx *= -1;
        
        if(m.y<5 || m.y>395)
          m.vy *= -1;
        
        // Membrane blocks movement
        if(!permeable){
          
          if(m.x>195 && m.x<205){
            
            m.vx *= -1;
            
          }
          
        }
        
      }
      
 }
 
  // Runs 60 times per second
    
    function draw(){
      
      background(235);
      
      drawCell();
      
      drawMembrane();
      
      updateMolecules();
      
      drawMolecules();
    }
    