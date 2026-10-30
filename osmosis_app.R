library(shiny)

ui <- fluidPage(
  tags$head(
    tags$meta(charset = "UTF-8"),
    tags$style(HTML("
      body { background:#f4f7f9; color:#263746; font-family:Arial,sans-serif; }
      .container-fluid { max-width:1180px; }
      .well, .info { background:white; border:1px solid #dce5eb; border-radius:12px; padding:16px; }
      .info { margin-top:14px; }
      #osmosis-canvas { width:100%; max-width:760px; margin:0 auto; }
      #osmosis-canvas canvas { display:block; max-width:100%; height:auto !important; }
      .btn-primary { background:#397c9b; border-color:#397c9b; }
      .hint { color:#687d8b; font-size:13px; }
    ")),
    tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"),
    tags$script(src = "simulation.js")
  ),
  titlePanel("Osmose: watertransport door een membraan"),
  p("Onderzoek hoe water zich verplaatst tussen twee oplossingen met verschillende concentraties. Water kan door het membraan; opgeloste-stofdeeltjes kunnen dat alleen als je die optie inschakelt."),
  div(class = "info",
      p("Water stroomt netto van een hogere naar een lagere waterpotentiaal. Een hogere concentratie opgeloste stof maakt de osmotische potentiaal negatiever. Temperatuur beïnvloedt de osmotische potentiaal en de snelheid van de deeltjes in deze animatie.")

  ),
  sidebarLayout(
    sidebarPanel(
      class = "well", width = 3,
      h4("Instellingen"),
      sliderInput("c_inside", "Concentratie links (mol/L)", min = 0, max = 1, value = 0.6, step = 0.05),
      sliderInput("c_outside", "Concentratie rechts (mol/L)", min = 0, max = 1, value = 0.4, step = 0.05),
      sliderInput("temperature", "Temperatuur (°C)", min = 0, max = 50, value = 25, step = 1),
      checkboxInput("water_permeable", "Water kan door het membraan", TRUE),
      checkboxInput("solute_permeable", "Opgeloste stof kan door het membraan", FALSE),
      actionButton("reset", "Reset", class = "btn-primary", width = "100%")
    ),
    mainPanel(
      width = 9,
      div(id = "osmosis-canvas"),
      div(class = "info", strong("Wat gebeurt er? "), textOutput("osmosis_explanation", inline = TRUE)),
      div(class = "info",
          strong("Waterpotentiaal (kPa)"),
          tableOutput("osmosis_values")
      )
    )
  )
)

server <- function(input, output, session) {
  observeEvent(
    list(input$c_inside, input$c_outside, input$temperature,
         input$water_permeable, input$solute_permeable, input$reset),
    {
      session$sendCustomMessage("osmosis_parameters", list(
        c_left = input$c_inside,
        c_right = input$c_outside,
        temp_c = input$temperature,
        water_permeable = input$water_permeable,
        solute_permeable = input$solute_permeable,
        reset = input$reset
      ))
    },
    ignoreInit = FALSE
  )
  
  output$osmosis_explanation <- renderText({
    req(input$live_state)
    s <- input$live_state
    if (!isTRUE(input$water_permeable)) {
      "Water kan niet door het membraan: er is geen netto watertransport."
    } else if (isTRUE(input$solute_permeable)) {
      "Beide stoffen kunnen passeren; het concentratieverschil verdwijnt geleidelijk."
    } else if (abs(s$delta_psi) < 0.5) {
      "Evenwicht: de waterpotentialen zijn vrijwel gelijk; er is geen netto transport."
    } else if (s$delta_psi > 0) {
      "Water stroomt netto van links (hogere Ψw) naar rechts (lagere Ψw)."
    } else {
      "Water stroomt netto van rechts (hogere Ψw) naar links (lagere Ψw)."
    }
  })
  
  output$osmosis_values <- renderTable({
    req(input$live_state)
    s <- input$live_state
    data.frame(
      Grootheid = c("Ψw links", "Ψw rechts", "Verschil (links − rechts)"),
      Waarde = sprintf("%.2f kPa", c(s$psi_left, s$psi_right, s$delta_psi))
    )
  }, striped = TRUE, bordered = FALSE, spacing = "s")
}

shinyApp(ui, server)
