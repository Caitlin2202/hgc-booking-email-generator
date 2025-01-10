document.addEventListener('DOMContentLoaded', () => {
    flatpickr("#booking-start-date", {
        dateFormat: "Y-m-d", // Format: Year-Month-Day
        defaultDate: "today", // Default to today's date
        minDate: "2025-01-06", // Prevent selecting past dates
        disable: ["2025-01-01"], // Example: Disable specific dates
        locale: {
            firstDayOfWeek: 1 // Set Monday as the first day of the week
        },
        onChange: function(selectedDates, dateStr, instance) {
            console.log("Selected Date: ", dateStr); // For debugging
        }
    });

    const form = document.getElementById('emailTemplateForm');
    const classListContainer = document.getElementById('class-booked');
    const termListContainer = document.getElementById('term-booked');

    // Fetch class data from classTimetable.json
    fetch('classTimetable.json')
    .then(response => response.json()) // Parse JSON data
    .then(classes => {
        let allClasses = classes; // Store all classes
        // Call the function to populate the dropdown initially
        populateClassDropdown(allClasses);

        // Event listeners for filter fields
        document.getElementById('class-day').addEventListener('change', () => updateClassList(allClasses));
        document.getElementById('venue').addEventListener('change', () => updateClassList(allClasses));
        document.getElementById('class-type').addEventListener('change', () => updateClassList(allClasses));
        document.getElementById('class-age').addEventListener('change', () => updateClassList(allClasses));

        // Function to update class list based on filters
        function updateClassList(classes) {
            const selectedDay = document.getElementById('class-day').value;
            const selectedVenue = document.getElementById('venue').value;
            const selectedType = document.getElementById('class-type').value;
            const selectedAge = document.getElementById('class-age').value;

            // Filter classes based on user input
            const filteredClasses = classes.filter(classItem => {
                return (
                    (selectedDay === "" || classItem.classDay === selectedDay) &&
                    (selectedVenue === "" || classItem.venueName === selectedVenue) &&
                    (selectedType === "" || classItem.classType === selectedType) &&
                    (selectedAge === "" || classItem.className === selectedAge)
                );
            });

            // Populate dropdown with filtered classes
            populateClassDropdown(filteredClasses);
        }

        // Function to populate the class dropdown
        function populateClassDropdown(classes) {
            classListContainer.innerHTML = ''; // Clear previous options
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '--Select a class--';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            classListContainer.appendChild(defaultOption);

            if (classes.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No classes found';
                classListContainer.appendChild(option);
            } else {
                classes.forEach(classItem => {
                    const option = document.createElement('option');
                    option.value = classItem.classCode; // Assuming each class has a unique classCode
                    option.textContent = `${classItem.className}, ${classItem.classType} ${classItem.classSubtype ? '(' + classItem.classSubtype + ')' : ''} ${classItem.classDay}, ${classItem.classTime} (${classItem.venueName})`;
                    classListContainer.appendChild(option);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error loading class data:', error);
    });

    // Fetch term data from termDates.json
    fetch('termDates.json')
    .then(response => response.json()) // Parse JSON data
    .then(terms => {
        // Populate the dropdown with terms
        populateTermDropdown(terms);
    })
    .catch(error => {
        console.error('Error loading term data:', error);
    });

    // Function to populate the term dropdown
    function populateTermDropdown(terms) {
        termListContainer.innerHTML = ''; // Clear previous options
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '--Select a term--';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        termListContainer.appendChild(defaultOption);

        terms.forEach(term => {
            const option = document.createElement('option');
            option.value = term.termName; // You can use termName or another unique identifier
            const formattedStartDate = formatDate(term.startDate);
            const formattedEndDate = formatDate(term.endDate);
            option.textContent = `${term.termName} (${formattedStartDate} - ${formattedEndDate})`;
            termListContainer.appendChild(option);
        });
    }


    const templateSelector = document.getElementById('email-template');
    const generalEmailsForm = document.getElementById('general-emails-form-container');
    const bookingEmailsForm = document.getElementById('booking-emails-form-container');

    // Function to hide all email form fields
    function hideAllFields() {
        const allFormContainers = [generalEmailsForm, bookingEmailsForm];
        allFormContainers.forEach(formContainer => {
            formContainer.style.display = 'none';
            const fields = formContainer.querySelectorAll('select, input, textarea');
            fields.forEach(field => {
                field.disabled = true;
                field.required = false;
                field.value = '';
            });
        });
    }

    // Function to show specific email form fields
    function showFields(formContainer) {
        formContainer.style.display = 'block';

        const fields = formContainer.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.disabled = false;
            field.required = true;
            field.value = '';
        });
    }

    const emailTemplateContainer = document.getElementById('emailTemplate');
    const termSelector = document.getElementById('term-booked');
    const bookingStartDateInput = document.getElementById('booking-start-date');
    const generalMessageTitleInput = document.getElementById('messageTitle');
    const generalMessageContentInput = document.getElementById('messageContent');
    const generalMessageSignatureInput = document.getElementById('messageSignature');

    // General message placeholders
    let placeholderGeneralMessageTitle = null;
    let placeholderGeneralMessageContent = null;
    let placeholderGeneralMessageSignature = null;

    // Booking confirmation placeholders
    let placeholderClassData = null; // store the class data
    let placeholderTermData = null;  // store the term data
    let placeholderBookingData = null; // store the booking data

    // Generate email based on template selected
    templateSelector.addEventListener('change', () => {
        const selectedTemplate = templateSelector.value;

        // Reset class, term & booking fields when a template selection is changed
        classListContainer.value = '';
        termSelector.value = '';
        bookingStartDateInput.value = '';

        // Reset the placeholders to empty (no previously selected values)
        placeholderGeneralMessageTitle = {};
        placeholderGeneralMessageSignature = {};
        placeholderGeneralMessageContent = {};
        placeholderClassData = {};
        placeholderTermData = {};
        placeholderBookingData = {};

        // Hide all form fields before showing the relevant ones
        hideAllFields();

        // Check if a valid template is selected
        if (selectedTemplate) {
            // Directly use selected value as the file name
            const templateFile = `${selectedTemplate}.html`;

            // Fetch the template file
            fetch(templateFile)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load template: ${templateFile}`);
                    }
                    return response.text();
                })
                .then(templateContent => {
                    // Check if the emailContent element exists
                    const emailContentElement = emailTemplateContainer.querySelector('#emailContent');

                    if (emailContentElement) {
                        // If it exists, replace its content with the template content
                        emailContentElement.innerHTML = templateContent;
                    } else {
                        // If the element doesn't exist, replace {{emailContent}} in the HTML
                        emailTemplateContainer.innerHTML = emailTemplateContainer.innerHTML.replace(
                            /{{emailContent}}/g, 
                            templateContent
                        );
                    }

                    // Show the relevant form fields based on the template selected
                    if (selectedTemplate === 'general-email') {
                        showFields(generalEmailsForm);
                    } else if (selectedTemplate === 'taster' || selectedTemplate === 'new-member' || selectedTemplate === 'auto-enrol') {
                        showFields(bookingEmailsForm);
                    }
                })
                .catch(error => {
                    console.error('Error loading template:', error);
                });
        } else {
            // If no template is selected, reset the placeholder
            const emailContentElement = emailTemplateContainer.querySelector('#emailContent');
            if (emailContentElement) {
                emailContentElement.innerHTML = '{{emailContent}}';  // Reset placeholder if necessary
            }
        }
    });

    generalMessageTitleInput.addEventListener('input', () => {
        const messageTitle = generalMessageTitleInput.value;
        placeholderGeneralMessageTitle = {
            messageTitle: messageTitle
        };

        updateEmailTemplate(placeholderGeneralMessageTitle, placeholderGeneralMessageSignature, placeholderGeneralMessageContent, placeholderClassData, placeholderTermData, placeholderBookingData)
    })

    const signatureMap = {
        "adminTeam": "HGC Admin Team",
        "managementTeam": "HGC Management Team"
    };

    generalMessageSignatureInput.addEventListener('change', () => {
        const messageSignature = generalMessageSignatureInput.value;
        const signatureText = signatureMap[messageSignature] || "";

        placeholderGeneralMessageSignature = {
            messageSignature: signatureText
        };

        updateEmailTemplate(placeholderGeneralMessageTitle, placeholderGeneralMessageSignature, placeholderGeneralMessageContent, placeholderClassData, placeholderTermData, placeholderBookingData)
    })

    generalMessageContentInput.addEventListener('input', () => {
        const messageContent = generalMessageContentInput.value;
        const formattedMessageContent = messageContent
            .split(/\n{2,}/) // Split by two or more newline characters (indicating a paragraph break)
            .map(paragraph => {
                // Replace single line breaks within paragraphs with <br> tags
                return `<p>${paragraph.split("\n").join("<br>")}</p>`;
            })
            .join(""); // Combine all <p> tags into a single string

        console.log(formattedMessageContent);
        placeholderGeneralMessageContent = {
            messageContent: formattedMessageContent
        };

        updateEmailTemplate(placeholderGeneralMessageTitle, placeholderGeneralMessageSignature, placeholderGeneralMessageContent, placeholderClassData, placeholderTermData, placeholderBookingData)
    })

    bookingStartDateInput.addEventListener('change', () => {
        const bookingStartDate = bookingStartDateInput.value;
        const formattedBookingStartDate = formatDate(bookingStartDate);
        placeholderBookingData = {
            bookingStartDate: formattedBookingStartDate
        };

        updateEmailTemplate(placeholderGeneralMessageTitle, placeholderGeneralMessageSignature, placeholderGeneralMessageContent, placeholderClassData, placeholderTermData, placeholderBookingData)
    })

    // Combined function to format both date strings (DD/MM/YYYY) and ISO date strings (YYYY-MM-DD)
    function formatDate(dateStr) {
        // If the date is in DD/MM/YYYY format (like "12/08/2024")
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return `${day}/${month}/${year}`;
        }

        // If the date is in ISO format (like "2024-12-08")
        else if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(dateStr); // Convert string to Date object
            if (isNaN(date)) {
                console.error("Invalid ISO date string:", dateStr);
                return "Invalid date";
            }

            // Extract day, month, and year
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        }

        console.error("Invalid date format:", dateStr);
        return "Invalid date"; // Return a default message for invalid date formats
    }

    fetch('classTimetable.json')
        .then(response => response.json())
        .then(classes => {
            let allClasses = classes;

            classListContainer.addEventListener('change', () => {
                const selectedClassCode = classListContainer.value;

                if (selectedClassCode) {
                    const selectedClass = allClasses.find(classItem => classItem.classCode === selectedClassCode);

                    if (selectedClass) {
                        fetch('venues.json')
                            .then(response => response.json())
                            .then(venues => {
                                const selectedVenue = venues.find(venue => venue.venueName === selectedClass.venueName);

                                placeholderClassData = {
                                    classType: selectedClass.classType || '',
                                    className: selectedClass.className || '',
                                    classAge: selectedClass.classAge || '',
                                    classDay: selectedClass.classDay || '',
                                    classTime: selectedClass.classTime || '',
                                    duration: selectedClass.duration || '',
                                    venueName: selectedClass.venueName || '',
                                    fullAddress: selectedVenue ? [selectedVenue.venueAddressLine1, selectedVenue.venueAddressLine2, selectedVenue.venueAddressLine3, selectedVenue.venueCityTown, selectedVenue.venuePostcode].filter(Boolean).join('<br>') : '',
                                };

                                updateEmailTemplate(placeholderGeneralMessageTitle, placeholderGeneralMessageSignature, placeholderGeneralMessageContent, placeholderClassData, placeholderTermData, placeholderBookingData);
                            })
                            .catch(error => console.error('Error loading venue data:', error));
                    }
                }
            });
        })
        .catch(error => console.error('Error loading class data:', error));

    fetch('termDates.json')
        .then(response => response.json())
        .then(terms => {
            let allTerms = terms;

            termSelector.addEventListener('change', () => {
                const selectedTermName = termSelector.value;
                if (selectedTermName) {
                    const selectedTerm = allTerms.find(t => t.termName === selectedTermName);
                    if (selectedTerm) {
                        placeholderTermData = {
                            termName: selectedTerm.termName || '',
                            termStartDate: selectedTerm.startDate || '',
                            termEndDate: selectedTerm.endDate || '',
                            offDates: selectedTerm.offDates || '',
                        };
                        updateEmailTemplate(placeholderGeneralMessageTitle, placeholderGeneralMessageSignature, placeholderGeneralMessageContent, placeholderClassData, placeholderTermData, placeholderBookingData);
                    }
                } else {
                    console.error('allTerms is not an array or selectedTermName is invalid');
                }
            });      
        })
        .catch(error => console.error('Error loading term data:', error));

        // Function to update email template content based on placeholders
        function updateEmailTemplate(placeholderGeneralMessageTitle, placeholderGeneralMessageSignature, placeholderGeneralMessageContent, placeholderClassData, placeholderTermData, placeholderBookingData) {
            const selectedTemplate = templateSelector.value;
            const templateFile = `${selectedTemplate}.html`;

            console.log(placeholderGeneralMessageTitle);
            console.log(placeholderGeneralMessageContent);
            console.log(placeholderGeneralMessageSignature);

            // Fetch the template and replace placeholders
            fetch(templateFile)
                .then(response => response.text())
                .then(templateContent => {
                    let updatedTemplateContent = templateContent;

                    // Replace placeholders
                    if (placeholderGeneralMessageTitle) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderGeneralMessageTitle, 'general-message');
                    }
                    if (placeholderGeneralMessageSignature) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderGeneralMessageSignature, 'general-message');
                    }
                    if (placeholderGeneralMessageContent) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderGeneralMessageContent, 'general-message');
                    }
                    if (placeholderClassData) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderClassData, 'class');
                    }
                    if (placeholderTermData) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderTermData, 'term');
                    }
                    if (placeholderBookingData) {
                        updatedTemplateContent = replacePlaceholders (updatedTemplateContent, placeholderBookingData, 'booking');
                    }

                    // Render the updated template
                    const emailContentElement = emailTemplateContainer.querySelector('#emailContent');
                    if (emailContentElement) {
                        emailContentElement.innerHTML = updatedTemplateContent;
                    } else {
                        emailTemplateContainer.innerHTML = emailTemplateContainer.innerHTML.replace(/{{emailContent}}/g, updatedTemplateContent);
                    }
                })
                .catch(error => console.error('Error loading template:', error));
        }


        // Function to replace placeholders in the template content
        function replacePlaceholders(templateContent, placeholderData, dataType) {
            if (dataType === 'general-message') {
                return templateContent.replace(/{{messageTitle}}/g, placeholderData.messageTitle || '{{messageTitle}}')
                    .replace(/{{messageSignature}}/g, placeholderData.messageSignature || '{{messageSignature}}')
                    .replace(/{{messageContent}}/g, placeholderData.messageContent || '{{messageContent}}');
            } else if (dataType === 'class') {
                return templateContent.replace(/{{classType}}/g, placeholderData.classType)
                    .replace(/{{className}}/g, placeholderData.className)
                    .replace(/{{classAge}}/g, placeholderData.classAge)
                    .replace(/{{classDay}}/g, placeholderData.classDay)
                    .replace(/{{classTime}}/g, placeholderData.classTime)
                    .replace(/{{duration}}/g, placeholderData.duration)
                    .replace(/{{venueName}}/g, placeholderData.venueName)
                    .replace(/{{fullAddress}}/g, placeholderData.fullAddress);
            } else if (dataType === 'term') {
                const offDatesFormatted = Array.isArray(placeholderData.offDates)
                ? placeholderData.offDates.join('<br>') // If it's an array, join with <br>
                : placeholderData.offDates;  // Otherwise, just use the original value
                return templateContent.replace(/{{termName}}/g, placeholderData.termName)
                    .replace(/{{termStartDate}}/g, placeholderData.termStartDate)
                    .replace(/{{termEndDate}}/g, placeholderData.termEndDate)
                    .replace(/{{offDates}}/g, offDatesFormatted);
            } else if (dataType === 'booking') {
                return templateContent.replace(/{{bookingStartDate}}/g, placeholderData.bookingStartDate);
            }
            return templateContent; // Return unchanged template if no valid data type
        }

});