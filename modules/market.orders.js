module.exports.init = function () {
  console.log("market.orders.js init called");
  try {
    var userid = JSON.parse(localStorage.getItem("users.code.activeWorld"))[0]._id;
    module.exports.userId = userid;
  } catch (error) {
    console.error("Failed to get userId from localstorage", error);
    console.log("attempting to get userId from /api/auth/me");
    module.ajaxGet(window.location.origin + "/api/auth/me", function (data, error) {
      console.log(data, error);
      if (data) {
        module.exports.userId = data._id;
      } else {
        console.error("Failed to acquire userId", data || error);
        return;
      }
    });
  }

  console.log("Found userId", module.exports.userId);
  

	module.exports.createFilters();

};

module.exports.update = function () {
  console.log("update getting called");
  
  module.exports.createFilters();
};

module.exports.createFilters = function() {
	
	//get rid of stupid max height.. the browser has its own scroll bar!
	$('.app-market-table').css('maxHeight','initial');
	
	// Find all header cells in the table
	var headerCells = $('mat-table mat-header-row mat-header-cell');

	// Loop through each header cell
	headerCells.each(function(){
		// Create a new input element
		var input = $('<input>', {
			type: 'text',
			class: 'filter-input',
			style: 'width: 100%',
			placeholder: $(this).text()
		});

		// Append the input element to the current header cell
		$(this).html(input);
	});
	
	var filterInputs = $('.filter-input');

	// Attach an event listener to each filter input
	filterInputs.on('input', function(){
		// Find all mat-row elements
		var matRows = $('mat-table mat-row');

		matRows.show();
			
		filterInputs.each(function(){

			// Get the current filter input's value
			var filterValue = $(this).val().toLowerCase();
			if(filterValue === '') {
				return;
			}
			
			// Find the index of the column of the current filter input
			var columnIndex = $(this).parent().index();


			// Loop through each mat-row element
			matRows.each(function(){
				var cell = $(this).find("mat-cell").eq(columnIndex);
				var matCellText;
				if(columnIndex == 0 ) {
					matCellText = $("[class^='market-resource-small']",cell).attr('class').substring(23).toLowerCase();
				} else {
					matCellText = cell.text().toLowerCase();
				}
				

				console.log(cell);
				console.log( matCellText + ' / ' + filterValue + ' / ' + columnIndex );
				// Check if the mat-cell text contains the filter value
				if (matCellText.indexOf(filterValue) === -1) {
					// Hide the mat-row element
					$(this).hide();
				}
			});
			
		});
	});
}