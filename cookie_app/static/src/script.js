// Entering: "transition ease-out duration-100"
// From: "transform opacity-0 scale-95"
// To: "transform opacity-100 scale-100"
// Leaving: "transition ease-in duration-75"
// From: "transform opacity-100 scale-100"
// To: "transform opacity-0 scale-95"

// function toggleDetailedTable(key) {
// 	var table = document.getElementById('detailed-' + key);
// 	if (table.style.display === 'none' || table.style.display === '') {
// 		table.style.display = 'table-row';
// 	} else {
// 		table.style.display = 'none';
// 	}
// }


document.addEventListener("DOMContentLoaded", function () {
	const profile = document.getElementById('user-menu-button');
	const menu = document.querySelector('[aria-labelledby="user-menu-button"]')

	profile.addEventListener('mouseover', (event) => {
		menu.classList.remove('transition', 'ease-out', 'duration-75', 'transform', 'opacity-0', 'scale-95', 'hover:opacity-100', 'hover:scale-100')
		menu.classList.add('transition', 'ease-out', 'duration-100', 'transform', 'opacity-100', 'scale-100', 'hover:opacity-100', 'hover:scale-100')
	})
	menu.addEventListener('mouseleave', (event) => {
		menu.classList.remove('transition', 'ease-out', 'duration-100', 'transform', 'opacity-100', 'scale-100', 'hover:opacity-100', 'hover:scale-100')
		menu.classList.add('transition', 'ease-out', 'duration-75', 'transform', 'opacity-0', 'scale-95')
	})

	document.querySelectorAll('tr.cookie_row').forEach(row => {
		row.addEventListener('click', () => {
			row.classList.toggle("cookie_selected")
		});
	});


	allsitesrows = document.querySelectorAll('.siteCookiesRow[data-site]')
	for(const site of allsitesrows){
		site.addEventListener('click',(e) => {
			siteAttr = site.getAttribute('data-site');
			let table = document.getElementById('detailed-'+siteAttr);
			if (table.style.display === 'none' || table.style.display === '') {
				table.style.display = 'table-row';
			} else {
				table.style.display = 'none';
			}
		});
	}

	// Prevent reload when click on current page anchor tags
	document.querySelectorAll('a').forEach(anchor => {
		anchor.addEventListener('click', function(event) {
			var href = this.getAttribute('href');
			var currentURL = window.location.pathname;
			if (href === currentURL) {
				event.preventDefault();  // prevent the default action (reload) if already on the page
			}
		});
	});

	if(document.getElementById('searchForm')){

		// Prevent page reload on form submit
		document.getElementById('searchForm').addEventListener('submit', function(event) {
			event.preventDefault();
		});
		// COOKIES SEARCH INPUT
		const searchInput = document.getElementById("default-search");
		// store name elements in array-like object
		// const namesFromDOM = document.getElementsByClassName("cookie_row");
		const namesFromDOM = document.querySelectorAll("tbody>tr");
		// listen for user events

		let timeout;
		searchInput.addEventListener("keyup", (event) => {
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				const { value } = event.target;

				// get user search input converted to lowercase
				const searchQuery = value.toLowerCase();

				for (const nameElement of namesFromDOM) {
					// store name text and convert to lowercase
					let name = nameElement.textContent.toLowerCase();
					// compare current name to search input
					if (name.includes(searchQuery)) {
						// found name matching search, display it
						nameElement.classList.add("visible");
						nameElement.style.display = "table-row";
					} else {
						// no match, don't display name
						nameElement.classList.remove("visible");
						nameElement.style.display = "none";
					}
				}
				if(document.location.pathname == '/scan-summary'){
					let allSites = document.querySelectorAll('.detailed-table[data-site]');
					for(const site of allSites){
						let siteAttr = site.getAttribute('data-site');
						// console.log(siteAttr);
						let allVisible = site.querySelectorAll('tbody>tr.visible').length;
						// console.log(visible_length);
						// document.querySelector('.siteCookiesRow[data-site="'+ siteAttr + '"] td.column_total_cookies').innerText = allVisible;

						// Hides all the rows without results
						if(allVisible > 0){
							document.querySelector('.siteCookiesRow[data-site="'+ siteAttr + '"] td.column_total_cookies').innerText = allVisible;
							document.querySelector('.siteCookiesRow[data-site="'+ siteAttr + '"]').style.display = "table-row";
						}else{
							document.querySelector('.siteCookiesRow[data-site="'+ siteAttr + '"]').style.display = "none";
						}
					}
				}
				// else if(document.location.pathname == '/scan-errors'){
				// 	let allVisible = site.querySelectorAll('tbody>tr.visible').length;
				// 	// console.log(visible_length);
				// 	// document.querySelector('.siteCookiesRow[data-site="'+ siteAttr + '"] td.column_total_cookies').innerText = allVisible;

				// 	// Hides all the rows without results
				// 	if(allVisible > 0){
				// 		document.querySelector('.siteCookiesRow[data-site="'+ siteAttr + '"]').style.display = "table-row";
				// 	}else{
				// 		document.querySelector('.siteCookiesRow[data-site="'+ siteAttr + '"]').style.display = "none";
				// 	}
				// }

			}, 300);
		});




	}

});

