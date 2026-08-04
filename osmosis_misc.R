js <- "
$(document).on('mousedown', '#type_moleculen option', function(e) {
  e.preventDefault(); // prevent default selection behavior
  var option = $(this);
  var select = option.parent();

  // toggle selected state
  option.prop('selected', !option.prop('selected'));

  // trigger change so Shiny sees the update
  select.trigger('change');

  return false; // stop further handling
});
"