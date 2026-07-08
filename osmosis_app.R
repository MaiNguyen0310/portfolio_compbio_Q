library(shiny)

ui <- fluidPage(
  
  # Load the p5.js library from a CDN
  tags$head(
    tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js")
  ),
  
  titlePanel("Transmembraan transport"),
  
  sidebarLayout(
    
    sidebarPanel(
      
      checkboxInput(
        "permeable",
        "Membraan permeabel",
        TRUE
      ),
      
      sliderInput(
        "n",
        "Aantal moleculen",
        min = 10,
        max = 100,
        value = 50
      )
      
    ),
    
    mainPanel(
      
      # This div is where p5.js will place the canvas
      tags$div(id = "canvas_container"),
      
      # Load our own JavaScript animation
      tags$script(src = "simulation.js")
      
    )
    
  )
  
)

server <- function(input, output, session){
  
  # Whenever a control changes,
  # send the new values to JavaScript.
  observe({
    
    session$sendCustomMessage(
      
      "parameters",
      
      list(
        permeable = input$permeable,
        n = input$n
      )
      
    )
    
  })
  
}

shinyApp(ui, server)