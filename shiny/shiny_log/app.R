source("shiny_vragen_style.R")

ui <- fluidPage(
  tags$head(
    tags$link(rel = "stylesheet", type = "text/css", href = "questions_style.css")
  ),
  
  titlePanel("Test jezelf: pH-berekeningen"),
  
  questionUI(
    id = "vraag1",
    question_number = 1,
    question_text = "Wat gebeurt er met de [H⁺]-concentratie als de pH daalt van 5 naar 3?",
    type = "mc",
    choices = c(
      "Ze wordt 2× zo groot",
      "Ze wordt 10× zo groot",
      "Ze wordt 100× zo groot",
      "Ze wordt 1000× zo groot"
    )
  ),
  
  questionUI(
    question_number = 2,
    id = "vraag2",
    question_text = "Wat is de protonenconcentratie in millimol per liter voor pH = 2?",
    type = "numeric"
  )
  
)


server <- function(input, output, session) {
  
  # Vraag 1
  questionServer(
    id = "vraag1",
    correct_answers = "Ze wordt 100× zo groot",
    type = "mc"
  )
  
  # Vraag 2
  questionServer(
    id = "vraag2",
    correct_answers = "10",   
    type = "numeric"
  )
}


shinyApp(ui, server)