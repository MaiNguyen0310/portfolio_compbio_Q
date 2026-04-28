library(shiny)


##########
# Layout #
##########

questionUI <- function(id,
                       question_text,
                       question_number = NULL,
                       type = "mc",
                       choices = NULL,
                       label = NULL) {
  ns <- NS(id)
  full_title <- if (!is.null(question_number)) {
    paste0("Vraag ", question_number, ": ", question_text)
  } else {
    question_text
  }
  
  if (!type %in% c("mc", "numeric")) {
    stop("`type` must be 'mc' or 'numeric'.")
  }
  
  tagList(
    tags$div(
      class = "question-card",
      tags$h4(full_title),
      
      if (type == "mc") {
        checkboxGroupInput(
          ns("choices"),
          label = if (is.null(label)) "Selecteer alle goede antwoorden:" else label,
          choices = choices
        )
      },
      
      if (type == "numeric") {
        numericInput(
          ns("numeric_answer"),
          label = if (is.null(label)) "Voer je antwoord in:" else label,
          value = NA_real_,
          step = 0.1
        )
      },
      
      actionButton(ns("check"), "Controleer", class = "btn-primary"),
      actionButton(ns("reset"), "Reset", class = "btn-secondary"),
      uiOutput(ns("feedback"))
    )
  )
}


questionServer <- function(id,
                           correct_answers,
                           type = "mc",
                           tol = 1e-6) {
  moduleServer(id, function(input, output, session) {
    
    if (!type %in% c("mc", "numeric")) {
      stop("`type` must be 'mc' or 'numeric'.")
    }
    
    observeEvent(input$check, {
      msg <- NULL
      
      
      if (type == "mc") {
        selected <- input$choices
        
        if (is.null(selected) || length(selected) == 0) {
          msg <- tags$span(style = "color:#c92a2a;", "Maak minimaal één keuze.")
        } else {
          correct <- setequal(selected, correct_answers)
          msg <- if (correct) {
            msg <- tags$span(class = "correct", "✔️ Correct!")
          } else {
            msg <- tags$span(class = "incorrect", "❌ Probeer opnieuw.")
          }
        }
      }
      
      # ---- Numeric ----
      if (type == "numeric") {
        user_val <- input$numeric_answer
        
        if (is.null(user_val) || is.na(user_val)) {
          msg <- tags$span(style = "color:#c92a2a;", "Voer een getal in.")
        } else {
          correct_val <- as.numeric(correct_answers)
          diff <- abs(as.numeric(user_val) - correct_val)
          
          msg <- if (!is.na(diff) && diff <= tol) {
            tags$span(style = "color:#0a8f3b; font-weight:bold;", "✔️ Correct!")
          } else {
            tags$span(style = "color:#c92a2a; font-weight:bold;", "❌ Onjuist. Probeer opnieuw.")
          }
        }
      }
      
      output$feedback <- renderUI(msg)
    })
    
    observeEvent(input$reset, {
      if (type == "mc") updateCheckboxGroupInput(session, "choices", selected = character(0))
      if (type == "numeric") updateNumericInput(session, "numeric_answer", value = NA_real_)
      output$feedback <- renderUI(NULL)
    })
  })
}