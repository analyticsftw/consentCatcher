// Entering: "transition ease-out duration-100"
// From: "transform opacity-0 scale-95"
// To: "transform opacity-100 scale-100"
// Leaving: "transition ease-in duration-75"
// From: "transform opacity-100 scale-100"
// To: "transform opacity-0 scale-95"

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
});


function toggleDetailedTable(key) {
	console.log(key)
	var table = document.getElementById('detailed-' + key);
	if (table.style.display === 'none' || table.style.display === '') {
		table.style.display = 'table-row';
	} else {
		table.style.display = 'none';
	}
}





