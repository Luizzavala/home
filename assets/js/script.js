document.addEventListener("DOMContentLoaded", function () {

    const menuContainer = document.getElementById("menu-container");

    fetch('./assets/data/data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('La solicitud HTTP falló');
            }
            return response.json();
        })
        .then(data => {
            const menuData = data.data;
            menuData.forEach(item => {
                const menuCard = document.createElement('div');
                menuCard.classList.add('menu-card');

                const itemName = document.createElement('h3');
                itemName.classList.add("menu-item-name");
                itemName.textContent = item.name;

                const itemPrice = document.createElement("p");
                itemPrice.classList.add("menu-item-price");
                itemPrice.textContent = "$ " + item.price.toFixed(2);

                menuCard.appendChild(itemName);
                menuCard.appendChild(itemPrice);

                menuContainer.appendChild(menuCard);
            });

        })
        .catch(error => {
            console.error('Error al cargar el archivo JSON:', error);
        });
});