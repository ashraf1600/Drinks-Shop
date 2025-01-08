// Url ta nisi ei web site theke https://www.thecocktaildb.com/api.php for data fetching
const BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';
const selectedDrinks = new Set();

// DOM Elements | Shahinnnn!!! HTML golo k  Dhore fel ,Dhore fel |
//----------------------------------------------------------------------
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const drinksList = document.getElementById('drinksList');
const selectedDrinksList = document.getElementById('selectedDrinksList');
const selectedCount = document.getElementById('selectedCount');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.querySelector('.close');

// Event Listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// Initialize the page // https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list
function initialize() {
    fetch(`${BASE_URL}/list.php?c=list`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch categories');
            return response.json();
        })
        .then(data => {
            const categories = data.drinks;
            if (categories && categories.length > 0) {
                const defaultCategory = categories[0].strCategory;
                loadDrinksByCategory(defaultCategory);
            }
        })
        .catch(error => {
            console.error('Initialization failed:', error);
            showError('Failed to load drinks. Please try again later.');
        });
}

// Load drinks by category
function loadDrinksByCategory(category) {
    fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch drinks');
            return response.json();
        })
        .then(data => {
            const drinks = data.drinks || [];
            displayDrinks(drinks.slice(0, 8));
        })
        .catch(error => {
            console.error('Failed to load drinks:', error);
            showError('Failed to load drinks. Please try again.');
        });
}

// Search functionality
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(searchTerm)}`)
        .then(response => {
            if (!response.ok) throw new Error('Search failed');
            return response.json();
        })
        .then(data => {
            const drinks = data.drinks || [];
            if (drinks.length === 0) {
                showError('No drinks found for your search.');
                drinksList.innerHTML = '<p class="no-results">No drinks found</p>';
                return;
            }
            displayDrinks(drinks);
        })
        .catch(error => {
            console.error('Search failed:', error);
            showError('Search failed. Please try again.');
        });
}

function viewDetails(drinkId) {
    fetch(`${BASE_URL}/lookup.php?i=${drinkId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch drink details');
            return response.json();
        })
        .then(data => {
            const drink = data.drinks?.[0];
            if (!drink) {
                throw new Error('Drink details not found.');
            }
            displayDrinkDetails(drink);
        })
        .catch(error => {
            console.error('Failed to fetch drink details:', error);
            showError('Failed to load drink details. Please try again.');
        });
}

// Display Functions
function displayDrinks(drinks) {
    drinksList.innerHTML = drinks.map(drink => `
        <div class="drink-card">
            <img src="${drink.strDrinkThumb}/preview" alt="${drink.strDrink}" 
                 onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
            <div class="drink-card-content">
                <h3>${drink.strDrink}</h3>
                <p>${drink.strCategory || 'Uncategorized'}</p>
                ${drink.strInstructions ? 
                    `<p>${drink.strInstructions.substring(0, 15)}...</p>` : 
                    ''}
                <div class="drink-card-buttons">
                    <button onclick="viewDetails('${drink.idDrink}')">Details</button>
                    <button 
                        onclick="addToGroup('${drink.idDrink}', '${drink.strDrink}')"
                        ${selectedDrinks.has(drink.idDrink) ? 'disabled' : ''}
                    >
                        Add to Group
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayDrinkDetails(drink) {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (ingredient) {
            ingredients.push(`${ingredient}${measure ? ` (${measure})` : ''}`);
        }
    }

    modalContent.innerHTML = `
        <h2>${drink.strDrink}</h2>
        <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" 
             onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'"
             style="max-width: 200px; margin: 10px 0;">
        <p><strong>Category:</strong> ${drink.strCategory || 'N/A'}</p>
        <p><strong>Glass:</strong> ${drink.strGlass || 'N/A'}</p>
        <p><strong>Instructions:</strong> ${drink.strInstructions || 'N/A'}</p>
        <div>
            <strong>Ingredients:</strong>
            <ul class="ingredients-list">
                ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>
        </div>
    `;
    modal.style.display = 'block';
}

// Group Management Functions
function addToGroup(drinkId, drinkName) {
    if (selectedDrinks.size >= 7) {
        showError('You cannot add more than 7 drinks to a group.');
        return;
    }

    selectedDrinks.add(drinkId);
    updateSelectedDrinksList(drinkId, drinkName);
    updateSelectedCount();
    
    // Update button state
    const addButton = document.querySelector(`button[onclick="addToGroup('${drinkId}', '${drinkName}')"]`);
    if (addButton) addButton.disabled = true;
}

function removeFromGroup(drinkId) {
    selectedDrinks.delete(drinkId);
    updateSelectedCount();
    
    // Update button state
    const addButton = document.querySelector(`button[onclick*="${drinkId}"]`);
    if (addButton) addButton.disabled = false;
    
    // Remove from selected list
    const listItem = document.querySelector(`li[data-drink-id="${drinkId}"]`);
    if (listItem) listItem.remove();
}

function updateSelectedDrinksList(drinkId, drinkName) {
    const li = document.createElement('li');
    li.setAttribute('data-drink-id', drinkId);
    li.innerHTML = `
        ${drinkName}
        <button onclick="removeFromGroup('${drinkId}')" class="remove-button">Remove</button>
    `;
    selectedDrinksList.appendChild(li);
}

function updateSelectedCount() {
    selectedCount.textContent = selectedDrinks.size;
}

function showError(message) {
    alert(message);
}

// Start the application
initialize();