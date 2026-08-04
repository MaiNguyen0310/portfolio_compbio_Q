library(shiny)

source("osmosis_text.R")
source("osmosis_misc.R")

ui <- fluidPage(
  
  
  titlePanel("Transmembraan transport"),
  p(intro_text),
  sidebarLayout(
    
    sidebarPanel(
      
      uiOutput("permeability_ui"),
      
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
  tags$script(HTML(js)),
  uiOutput("transporter_ui"),
    
  selectInput("type_moleculen", 
              "Type moleculen", 
              c("Kalium", "Natrium", "Glucose"),
              selected = "Glucose",
              multiple = TRUE,
              selectize = FALSE)
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
    
  ),
  
  div(class = "footer",
      p(footer_text, style = "font-size:80%")),
  
)

server <- function(input, output, session){
  output$permeability_ui <- renderUI({
    
    req(input$type_moleculen)
    
    tags$table(
      class = "table table-sm",
      tags$thead(
        tags$tr(
          tags$th("Molecuul"),
          tags$th("Permeabel")
        )
      ),
      tags$tbody(
        
        lapply(input$type_moleculen, function(mol){
          
          tags$tr(
            
            tags$td(mol),
            
            tags$td(
              checkboxInput(
                paste0("perm_", mol),
                label = NULL,
                value = TRUE,
                width = NULL
              )
            )
            
          )
          
        })
        
      )
    )
    
  })
  
  
  output$transporter_ui <- renderUI({
    
    transporters <- c(
      "GLUT",
      "Na_channel",
      "K_channel",
      "NaK_pump"
    )
    
    tags$table(
      class = "table table-sm",
      tags$thead(
        tags$tr(
          tags$th("Transporter"),
          tags$th("Aanwezig")
        )
      ),
      tags$tbody(
        
        lapply(transporters, function(tp){
          
          tags$tr(
            
            tags$td(tp),
            
            tags$td(
              checkboxInput(
                paste0("trans_", tp),
                label = NULL,
                value = FALSE
              )
            )
            
          )
          
        })
        
      )
    )
    
  })
  
  observe({
    
    req(input$type_moleculen)
    
    permeability <- setNames(
      
      lapply(input$type_moleculen, function(mol){
        
        input[[paste0("perm_", mol)]]
        
      }),
      
      input$type_moleculen
      
    )
    
    transporter_present <- list(
      
      GLUT      = input$trans_GLUT,
      Na_channel = input$trans_Na_channel,
      K_channel  = input$trans_K_channel,
      NaK_pump   = input$trans_NaK_pump
      
    )
    
    session$sendCustomMessage(
      
      "parameters",
      
      list(
        
        n = input$n,
        transport_type = input$type_transport,
        molecule_type = input$type_moleculen,
        
        permeable = permeability,
        
        transporters = transporter_present
        
      )
      
    )
    
  })
    
    ignoreInit = FALSE
  
}



shinyApp(ui, server)