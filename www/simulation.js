
  // Parameters coming from Shiny
  
  let permeable = true;
  let numberOfMolecules = 60;
  
  // store all molecules
  let molecules = [];
  
    // Receive updates from the R sliders
    
    Shiny.addCustomMessageHandler(
      
      "parameters",
      
      function(message){
        
        permeable = message.permeable;
        
        // If the number of molecules changes,
        // recreate the system.
        if(message.n !== numberOfMolecules){
          
          numberOfMolecules = message.n;
          createMolecules();
          
        }
        
      }
      
    );

    // initiate molecules
    
    function createMolecules(){
      
      molecules = [];
      
      for(let i=0;i<numberOfMolecules;i++){
        
        // Half start on the left,
        // half on the right.
        
        let x;
        
        if(i < numberOfMolecules/2)
          x = random(20,190);
        else
          x = random(210,380);
        
        molecules.push({
          
          x : x,
          y : random(20,380),
          
          // Small random velocity
          vx : random(-1,1),
          vy : random(-1,1)
          
        });
        
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
      fill("#001158");
      noStroke();
      for(let m of molecules){
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
    