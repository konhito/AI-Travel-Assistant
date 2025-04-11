// API Configuration
const FLIGHT_API_KEY = "API_KEY_HERE"; // Add your RapidAPI key here (same key works for both APIs)
const HOTEL_API_KEY = "API_KEY_HERE"; // Add your RapidAPI key here (same key works for both APIs)
const AVIATION_API_KEY = "API_KEY_HERE";

// City to IATA Code Mapping
const cityToIATA = {
  // India
  mumbai: "BOM",
  delhi: "DEL",
  bangalore: "BLR",
  chennai: "MAA",
  kolkata: "CCU",
  hyderabad: "HYD",
  ahmedabad: "AMD",
  pune: "PNQ",
  goa: "GOI",

  // UK
  london: "LHR",
  manchester: "MAN",
  birmingham: "BHX",

  // USA
  newyork: "JFK",
  chicago: "ORD",
  losangeles: "LAX",
  miami: "MIA",
  sanfrancisco: "SFO",

  // Other major cities
  dubai: "DXB",
  singapore: "SIN",
  bangkok: "BKK",
  paris: "CDG",
  frankfurt: "FRA",
};

// Add this after the cityToIATA object
const indianHotels = [
  { name: "The Grand Palace", chain: "Taj Hotels", location: "Mumbai" },
  { name: "Royal Imperial", chain: "Oberoi Group", location: "Delhi" },
  { name: "Lotus Residency", chain: "ITC Hotels", location: "Bangalore" },
  { name: "The Sapphire Hotel", chain: "The Leela", location: "Chennai" },
  { name: "Golden Crown Hotel", chain: "Marriott", location: "Kolkata" },
  { name: "Lake View Resort", chain: "Taj Hotels", location: "Udaipur" },
  { name: "The Emerald Palace", chain: "Marriott", location: "Pune" },
  { name: "Crystal Heights", chain: "Hyatt", location: "Mumbai" },
  { name: "The Peacock Court", chain: "Independent", location: "Delhi" },
  { name: "Rose Garden Resort", chain: "Hyatt", location: "Chennai" },
  { name: "The Ivory Towers", chain: "Taj Hotels", location: "Bangalore" },
  { name: "Sunset Valley Resort", chain: "ITC Hotels", location: "Goa" },
  { name: "Royal Paradise", chain: "Oberoi Group", location: "Jaipur" },
  { name: "The Palm Grove", chain: "The Leela", location: "Hyderabad" },
  { name: "Diamond Bay Hotel", chain: "Marriott", location: "Kochi" },
];

// Helper function to get IATA code
function getIATACode(city) {
  const normalizedCity = city.toLowerCase().replace(/\s+/g, "");
  return cityToIATA[normalizedCity] || city.toUpperCase();
}

// Note: You can use the same RapidAPI key for both services
// Get your API key from:
// 1. https://rapidapi.com/skyscanner/api/skyscanner-flight-search
// 2. https://rapidapi.com/tipsters/api/booking-com

// DOM Elements
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const searchFormContainer = document.getElementById("searchFormContainer");
const searchForm = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");
const loadingDiv = document.getElementById("loading");

// Chat state
let conversationState = {
  collectingInfo: false,
  currentStep: null,
  collectedInfo: {},
  lastQuestion: null,
};

// Event Listeners
sendButton.addEventListener("click", handleUserMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleUserMessage();
  }
});

// Chat Functions
function handleUserMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat(message, "user");
  userInput.value = "";

  // Process the message
  processUserMessage(message);
}

function addMessageToChat(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender}-message`;
  messageDiv.innerHTML = `<p>${message}</p>`;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function processUserMessage(message) {
  const lowerMessage = message.toLowerCase();

  // Handle hotel search response
  if (conversationState.lastQuestion === "hotel") {
    if (
      lowerMessage.includes("yes") ||
      lowerMessage.includes("sure") ||
      lowerMessage.includes("ok")
    ) {
      displayRandomHotels(); // Directly show random hotels
      conversationState.lastQuestion = null; // Reset the state
      return;
    }
    conversationState.lastQuestion = null;
    return;
  }

  if (conversationState.collectingInfo) {
    handleInfoCollection(message);
    return;
  }

  if (lowerMessage.includes("flight") || lowerMessage.includes("fly")) {
    startFlightSearch();
  } else if (lowerMessage.includes("hotel") || lowerMessage.includes("stay")) {
    startHotelSearch();
  } else if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("what can you do")
  ) {
    showHelpMessage();
  } else {
    addMessageToChat(
      "I'm not sure I understand. You can ask me about flights, hotels, or type 'help' to see what I can do.",
      "bot"
    );
  }
}

function startFlightSearch() {
  conversationState.collectingInfo = true;
  conversationState.currentStep = "from";
  addMessageToChat(
    "Great! Let's find you the best flight deals. Where will you be flying from?",
    "bot"
  );
}

function startHotelSearch() {
  conversationState.collectingInfo = true;
  conversationState.currentStep = "location";
  addMessageToChat(
    "I'll help you find the perfect hotel. Which city would you like to stay in?",
    "bot"
  );
}

function handleInfoCollection(message) {
  switch (conversationState.currentStep) {
    case "from":
      conversationState.collectedInfo.from = message;
      conversationState.currentStep = "to";
      addMessageToChat("Where would you like to fly to?", "bot");
      break;
    case "to":
      conversationState.collectedInfo.to = message;
      conversationState.currentStep = "date";
      addMessageToChat(
        "When would you like to travel? Please enter the date in YYYY-MM-DD format (e.g., 2024-04-15)",
        "bot"
      );
      break;
    case "date":
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(message)) {
        addMessageToChat(
          "Please enter the date in YYYY-MM-DD format (e.g., 2024-04-15)",
          "bot"
        );
        return;
      }
      const inputDate = new Date(message);
      const today = new Date();
      if (inputDate < today) {
        addMessageToChat("Please enter a future date.", "bot");
        return;
      }
      conversationState.collectedInfo.date = message;
      completeFlightSearch();
      break;
    case "location":
      conversationState.collectedInfo.hotelLocation = message;
      conversationState.currentStep = "checkInDate";
      addMessageToChat(
        "When would you like to check in? (Please enter date in YYYY-MM-DD format)",
        "bot"
      );
      break;
    case "checkInDate":
      conversationState.collectedInfo.checkInDate = message;
      completeHotelSearch();
      break;
  }
}

function completeFlightSearch() {
  addMessageToChat("Searching for the best flight deals...", "bot");
  showLoading();

  searchFlights(conversationState.collectedInfo)
    .then((flights) => {
      hideLoading();
      displayFlightResults(flights);
      resetConversationState();
    })
    .catch((error) => {
      hideLoading();
      addMessageToChat(
        "I'm sorry, I couldn't find any flights. Please try again later.",
        "bot"
      );
      resetConversationState();
    });
}

function completeHotelSearch() {
  addMessageToChat("Searching for the best hotel deals...", "bot");
  showLoading();

  searchHotels(conversationState.collectedInfo)
    .then((hotels) => {
      hideLoading();
      displayHotelResults(hotels);
      resetConversationState();
    })
    .catch((error) => {
      hideLoading();
      addMessageToChat(
        "I'm sorry, I couldn't find any hotels. Please try again later.",
        "bot"
      );
      resetConversationState();
    });
}

function resetConversationState() {
  conversationState = {
    collectingInfo: false,
    currentStep: null,
    collectedInfo: {},
    lastQuestion: null,
  };
}

function showHelpMessage() {
  addMessageToChat("I can help you with:", "bot");
  addMessageToChat(
    "- Finding the best flight deals\n- Searching for hotels\n- Planning your itinerary\n- Getting travel recommendations\n\nJust tell me what you're looking for!",
    "bot"
  );
}

// API Functions
async function searchFlights(data) {
  const fromCode = getIATACode(data.from);
  const toCode = getIATACode(data.to);

  // Using AviationStack API with date parameters
  const url = `https://api.aviationstack.com/v1/flights?access_key=${AVIATION_API_KEY}&dep_iata=${fromCode}&arr_iata=${toCode}&date=${data.date}`;

  try {
    console.log("Searching flights with URL:", url);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("API Response:", result);

    if (!result.data || result.data.length === 0) {
      throw new Error("No flights found for the given criteria");
    }

    // Process and return flight data
    const flights = result.data.map((flight) => ({
      airline: flight.airline.name,
      flightNumber: flight.flight.iata,
      departureTime: flight.departure.scheduled,
      arrivalTime: flight.arrival.scheduled,
      status: flight.flight_status,
      from: flight.departure.airport,
      to: flight.arrival.airport,
      terminal: flight.departure.terminal || "Not specified",
      gate: flight.departure.gate || "Not specified",
      date: data.date,
    }));

    return flights;
  } catch (error) {
    console.error("Flight search error:", error);
    throw new Error(`Failed to fetch flight data: ${error.message}`);
  }
}

async function searchHotels(data) {
  // Using Booking.com API as an example
  const url = `https://booking-com.p.rapidapi.com/v1/hotels/search?location=${data.hotelLocation}&checkin_date=${data.checkInDate}&adults_number=1`;

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": HOTEL_API_KEY,
      "X-RapidAPI-Host": "booking-com.p.rapidapi.com",
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result.result.map((hotel) => ({
      name: hotel.hotel_name,
      price: hotel.min_total_price,
      rating: hotel.review_score,
      location: hotel.address,
    }));
  } catch (error) {
    throw new Error("Failed to fetch hotel data");
  }
}

// Display Functions
function displayFlightResults(flights) {
  if (flights.length === 0) {
    addMessageToChat(
      "I couldn't find any flights matching your criteria. Would you like to try a different search?",
      "bot"
    );
    return;
  }

  // Take only top 5 flights
  const topFlights = flights.slice(0, 5);

  let message = "Here are the top 5 available flights:\n\n";
  message += "<div class='flight-cards-container'>";

  topFlights.forEach((flight, index) => {
    const departureTime = new Date(flight.departureTime).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    );
    const arrivalTime = new Date(flight.arrivalTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const flightDate = new Date(flight.departureTime).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

    // Generate random price between ₹5000 and ₹50000
    const basePrice = Math.floor(Math.random() * 45000) + 5000;
    // Add some variation based on airline and route
    const airlineMultiplier = flight.airline.includes("Air India")
      ? 1.2
      : flight.airline.includes("Emirates")
      ? 1.5
      : 1.0;
    const routeMultiplier =
      flight.from === "BOM" && flight.to === "DEL" ? 0.8 : 1.0;
    const finalPrice = Math.round(
      basePrice * airlineMultiplier * routeMultiplier
    );

    message += `
            <div class='flight-card'>
                <div class='flight-header'>
                    <span class='flight-number'>Flight #${index + 1}</span>
                    <span class='flight-status ${flight.status.toLowerCase()}'>${
      flight.status
    }</span>
                </div>
                <div class='flight-airline'>
                    <span class='airline-icon'>✈️</span>
                    <span class='airline-name'>${flight.airline}</span>
                    <span class='flight-code'>(${flight.flightNumber})</span>
                </div>
                <div class='flight-date'>
                    <span class='date-icon'>📅</span>
                    <span class='date'>${flightDate}</span>
                </div>
                <div class='flight-route'>
                    <div class='route-details'>
                        <span class='from'>${flight.from}</span>
                        <span class='arrow'>→</span>
                        <span class='to'>${flight.to}</span>
                    </div>
                    <div class='time-details'>
                        <span class='departure-time'>${departureTime}</span>
                        <span class='arrival-time'>${arrivalTime}</span>
                    </div>
                </div>
                <div class='flight-price'>
                    <span class='price-icon'>💰</span>
                    <span class='price'>₹${finalPrice.toLocaleString(
                      "en-IN"
                    )}</span>
                </div>
                <div class='flight-terminal'>
                    <span class='terminal'>Terminal: ${flight.terminal}</span>
                    <span class='gate'>Gate: ${flight.gate}</span>
                </div>
            </div>
        `;
  });

  message += "</div>";

  // Add CSS styles for the cards
  message += `
        <style>
            .flight-cards-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin: 20px 0;
            }
            .flight-card {
                background: #ffffff;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
            }
            .flight-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .flight-number {
                font-weight: bold;
                color: #333;
            }
            .flight-status {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.8em;
            }
            .flight-status.scheduled {
                background: #e3f2fd;
                color: #1976d2;
            }
            .flight-status.active {
                background: #e8f5e9;
                color: #2e7d32;
            }
            .flight-airline {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            .airline-name {
                font-weight: bold;
                color: #333;
            }
            .flight-code {
                color: #666;
            }
            .flight-route {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
            }
            .route-details {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .from, .to {
                font-weight: bold;
                color: #333;
            }
            .arrow {
                color: #666;
            }
            .time-details {
                color: #666;
            }
            .flight-price {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 10px 0;
                font-weight: bold;
                color: #2e7d32;
            }
            .flight-terminal {
                display: flex;
                justify-content: space-between;
                color: #666;
                font-size: 0.9em;
            }
        </style>
    `;

  addMessageToChat(message, "bot");

  // Add hotel prompt after flight results
  setTimeout(() => {
    addMessageToChat(
      "Would you like me to help you find a hotel at your destination?",
      "bot"
    );
    conversationState.lastQuestion = "hotel"; // Set the lastQuestion state
    conversationState.collectingInfo = false;
    conversationState.currentStep = null;
  }, 1000);
}

function displayHotelResults(hotels) {
  // Generate 5 random hotels
  let randomHotels = [];
  for (let i = 0; i < 5; i++) {
    const randomPrice = Math.floor(Math.random() * 15000) + 5000; // Random price between 5000-20000
    const randomRating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3.0-5.0
    const randomHotel =
      indianHotels[Math.floor(Math.random() * indianHotels.length)];

    randomHotels.push({
      ...randomHotel,
      price: randomPrice,
      rating: randomRating,
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"][
        Math.floor(Math.random() * 5)
      ],
    });
  }

  let message = "Here are the top 5 hotels at your destination:\n\n";
  message += "<div class='hotel-cards-container'>";

  randomHotels.forEach((hotel, index) => {
    message += `
            <div class='hotel-card'>
                <div class='hotel-header'>
                    <span class='hotel-number'>Hotel #${index + 1}</span>
                    <span class='hotel-chain'>${hotel.chain}</span>
                </div>
                <div class='hotel-name'>
                    <span class='hotel-icon'>🏨</span>
                    <span class='name'>${hotel.name}</span>
                </div>
                <div class='hotel-rating'>
                    <span class='rating-icon'>⭐</span>
                    <span class='rating'>${hotel.rating}</span>
                </div>
                <div class='hotel-price'>
                    <span class='price-icon'>💰</span>
                    <span class='price'>₹${hotel.price.toLocaleString(
                      "en-IN"
                    )}/night</span>
                </div>
                <div class='hotel-amenities'>
                    <span class='amenities-icon'>🎁</span>
                    <span class='amenities'>${hotel.amenities}</span>
                </div>
            </div>
        `;
  });

  message += "</div>";

  // Add CSS styles for hotel cards
  message += `
        <style>
            .hotel-cards-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin: 20px 0;
            }
            .hotel-card {
                background: #ffffff;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
            }
            .hotel-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .hotel-number {
                font-weight: bold;
                color: #333;
            }
            .hotel-chain {
                color: #666;
                font-style: italic;
            }
            .hotel-name {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            .name {
                font-weight: bold;
                color: #333;
                font-size: 1.2em;
            }
            .hotel-rating, .hotel-price, .hotel-amenities {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 8px 0;
            }
            .rating {
                color: #f4b400;
                font-weight: bold;
            }
            .price {
                color: #2e7d32;
                font-weight: bold;
            }
            .amenities {
                color: #666;
            }
        </style>
    `;

  addMessageToChat(message, "bot");
}

function displayRandomHotels() {
  // Generate 5 random hotels
  let randomHotels = [];
  const usedIndices = new Set();

  while (randomHotels.length < 5) {
    const index = Math.floor(Math.random() * indianHotels.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      const hotel = indianHotels[index];
      const randomPrice = Math.floor(Math.random() * 15000) + 5000;
      const randomRating = (Math.random() * 2 + 3).toFixed(1);
      const amenities = [
        "WiFi, Pool, Spa",
        "Restaurant, Gym, Bar",
        "Pool, Restaurant, Room Service",
        "Spa, WiFi, Conference Room",
        "Gym, Bar, Room Service",
      ][Math.floor(Math.random() * 5)];

      randomHotels.push({
        ...hotel,
        price: randomPrice,
        rating: randomRating,
        amenities: amenities,
      });
    }
  }

  // Display each hotel in a separate message
  addMessageToChat("Here are 5 recommended luxury hotels:", "bot");

  randomHotels.forEach((hotel, index) => {
    const message = `
            <div class='single-hotel-card'>
                <div class='hotel-header'>
                    <div class='hotel-title'>
                        <span class='hotel-icon'>🏨</span>
                        <span class='hotel-name'>${hotel.name}</span>
                    </div>
                    <span class='hotel-chain'>${hotel.chain}</span>
                </div>
                <div class='hotel-info'>
                    <div class='info-row'>
                        <span class='location'>📍 ${hotel.location}</span>
                        <span class='rating'>⭐ ${hotel.rating}</span>
                    </div>
                    <div class='price-row'>
                        <span class='price'>💰 ₹${hotel.price.toLocaleString(
                          "en-IN"
                        )}/night</span>
                    </div>
                    <div class='amenities-row'>
                        <span class='amenities'>🎁 ${hotel.amenities}</span>
                    </div>
                </div>
            </div>

            <style>
                .single-hotel-card {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    margin: 10px 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border: 1px solid #e0e0e0;
                    max-width: 500px;
                }
                .hotel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #eee;
                }
                .hotel-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .hotel-name {
                    font-size: 1.2em;
                    font-weight: bold;
                    color: #2c3e50;
                }
                .hotel-chain {
                    color: #666;
                    font-style: italic;
                }
                .hotel-info {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .location {
                    color: #34495e;
                }
                .rating {
                    color: #f39c12;
                    font-weight: bold;
                }
                .price-row {
                    margin: 8px 0;
                }
                .price {
                    color: #27ae60;
                    font-weight: bold;
                    font-size: 1.1em;
                }
                .amenities-row {
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 6px;
                }
                .amenities {
                    color: #666;
                    font-size: 0.9em;
                }
            </style>
        `;

    addMessageToChat(message, "bot");
  });
}

// Utility Functions
function showLoading() {
  loadingDiv.classList.remove("hidden");
}

function hideLoading() {
  loadingDiv.classList.add("hidden");
}
