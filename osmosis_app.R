library(shiny)

ui <- fluidPage(
  
  
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
      ),
    
  selectInput("type_transport", 
              "Type transport", 
              list("Diffusie", 
                   "Actief transport",
                    "Cotransport",
                   "Symport",
                   "Antiport"),
              multiple = FALSE,
              selectize = TRUE),
  
  selectInput("type_moleculen", 
              "Type moleculen", 
              c("Kalium", "Natrium", "Glucose"),
              selected = "Glucose",
              multiple = TRUE,
              selectize = TRUE)
  ),
    
    mainPanel(
      # Load the p5.js library from a CDN
      tags$head(
        tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js")
      ),
      
      # This div is where p5.js will place the canvas
      tags$div(id = "canvas_container"),
      
      # Load our own JavaScript animation
      tags$script(src = "simulation.js")
      
    )
    
  )
  
)

server <- function(input, output, session){
  
  observeEvent(
    list(
      input$permeable,
      input$n,
      input$type_transport,
      input$type_moleculen
    ),
    {
      
      req(input$type_moleculen)
      
      session$sendCustomMessage(
        
        "parameters",
        
        list(
          permeable = input$permeable,
          n = input$n,
          transport_type = input$type_transport,
          molecule_type = input$type_moleculen
        )
        
      )
      
    },
    
    ignoreInit = FALSE
  )
  
}

shinyApp(ui, server)