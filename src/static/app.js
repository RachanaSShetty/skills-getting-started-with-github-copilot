document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Base content
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const title = document.createElement("div");
        title.className = "participants-title";
        title.textContent = "Participants";

        participantsSection.appendChild(title);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            const badge = document.createElement("span");
            badge.className = "participant-badge";
            badge.textContent = p; // email or name

            // Add delete icon
            const deleteIcon = document.createElement("span");
            deleteIcon.className = "delete-icon";
            deleteIcon.innerHTML = "✕";
            deleteIcon.title = "Unregister participant";

            deleteIcon.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  {
                    method: "POST",
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  // Remove the participant from the UI
                  li.remove();

                  // Show success message
                  messageDiv.textContent = result.message;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");

                  // Hide message after 5 seconds
                  setTimeout(() => {
                    messageDiv.classList.add("hidden");
                  }, 5000);

                  // Update spots left
                  const updatedSpots = spotsLeft + 1;
                  activityCard.querySelector("p strong:last-child").parentElement.textContent = 
                    `Availability: ${updatedSpots} spots left`;

                  // If no participants left, show "No participants yet"
                  if (details.participants.length === 1) {
                    const empty = document.createElement("div");
                    empty.className = "participants-empty";
                    empty.textContent = "No participants yet";
                    participantsSection.replaceChild(empty, ul);
                  }
                } else {
                  messageDiv.textContent = result.detail || "An error occurred";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (error) {
                messageDiv.textContent = "Failed to unregister participant. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering:", error);
              }
            });

            li.appendChild(badge);
            li.appendChild(deleteIcon);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const empty = document.createElement("div");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet";
          participantsSection.appendChild(empty);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Update the UI directly instead of refreshing all activities
        const activityCard = document.querySelector(`.activity-card:has(h4:contains("${activity}"))`);
        if (activityCard) {
          // Update spots left
          const spotsLeftText = activityCard.querySelector("p strong:contains('Availability')").parentElement;
          const currentSpots = parseInt(spotsLeftText.textContent.match(/\d+/)[0]) - 1;
          spotsLeftText.textContent = `Availability: ${currentSpots} spots left`;

          // Update participants list
          const participantsSection = activityCard.querySelector(".participants-section");
          const participantsList = participantsSection.querySelector(".participants-list");
          const participantsEmpty = participantsSection.querySelector(".participants-empty");

          if (participantsEmpty) {
            // Remove "No participants yet" message
            participantsEmpty.remove();
            
            // Create new participants list
            const ul = document.createElement("ul");
            ul.className = "participants-list";
            participantsSection.appendChild(ul);
          }

          // Add the new participant
          const ul = participantsSection.querySelector(".participants-list");
          const li = document.createElement("li");
          const badge = document.createElement("span");
          badge.className = "participant-badge";
          badge.textContent = email;

          // Add delete icon
          const deleteIcon = document.createElement("span");
          deleteIcon.className = "delete-icon";
          deleteIcon.innerHTML = "✕";
          deleteIcon.title = "Unregister participant";

          deleteIcon.addEventListener("click", async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
                {
                  method: "POST",
                }
              );

              const result = await response.json();

              if (response.ok) {
                // Remove the participant from the UI
                li.remove();

                // Show success message
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");

                // Hide message after 5 seconds
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);

                // Update spots left
                const updatedSpots = currentSpots + 1;
                spotsLeftText.textContent = `Availability: ${updatedSpots} spots left`;

                // If no participants left, show "No participants yet"
                if (!ul.children.length) {
                  const empty = document.createElement("div");
                  empty.className = "participants-empty";
                  empty.textContent = "No participants yet";
                  participantsSection.replaceChild(empty, ul);
                }
              } else {
                messageDiv.textContent = result.detail || "An error occurred";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (error) {
              messageDiv.textContent = "Failed to unregister participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering:", error);
            }
          });

          li.appendChild(badge);
          li.appendChild(deleteIcon);
          ul.appendChild(li);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
