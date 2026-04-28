## learnr vragen (langzaam - alleen runnen als veranderd)
# rsconnect::deployApp("evo-devo/vragen_log")
# rsconnect::deployApp("shiny_log")
# rsconnect::deployApp("practica/")

library(quarto)
# de Qmd die gedownload kan worden
quarto_render("evo-devo/schaling.qmd", output_file = "schaling.html")
dir.create("downloads", showWarnings = FALSE)
file.copy("evo-devo/schaling.qmd", "downloads/schaling.qmd", overwrite = TRUE)
file.copy("evo-devo/schaling.html", "downloads/schaling.html", overwrite = TRUE)

# volledig boek
quarto_render()
