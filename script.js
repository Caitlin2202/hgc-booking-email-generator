document.addEventListener('DOMContentLoaded', () => {
    const allPickers = [];

    document.querySelectorAll('.date-input').forEach(input => {
        const picker = flatpickr(input, {
            dateFormat: "Y-m-d",
            locale: { firstDayOfWeek: 1 },
            minDate: "today"
        });

        allPickers.push(picker);
    });

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

    const advTrialDatePicker = flatpickr("#trial-class-date", {
        dateFormat: "Y-m-d", // Format: Day-Month-Year
        defaultDate: "today", // Default to today's date
        minDate: "today", // Prevent selecting past dates
        disable: ["2025-01-01"], // Example: Disable specific dates
        locale: {
            firstDayOfWeek: 1 // Set Monday as the first day of the week
        },
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                const selectedDate = selectedDates[0];
                const maxDeadlineDate = new Date(selectedDate);
                maxDeadlineDate.setDate(selectedDate.getDate() - 3); // -3 days

                // Update the minDate of the confirmation deadline picker
                advTrialDeadlineDatePicker.set("maxDate", maxDeadlineDate);

                console.log("Trial class selected:", selectedDate);
                console.log("Deadline must be after:", maxDeadlineDate);
            }
            console.log("Selected Date: ", dateStr); // For debugging
        }
    });

    const advTrialDeadlineDatePicker = flatpickr("#trial-confirmation-deadline", {
        dateFormat: "Y-m-d", // Format: Day-Month-Year
        defaultDate: "today", // Default to today's date
        minDate: "today", // Prevent selecting past dates
        disable: [
            "2025-01-01",
            function(date) {
            // Return true to disable the date
            const day = date.getDay(); // 0 = Sunday, 6 = Saturday
            return day === 0 || day === 6; // disable weekends
        }
        ], // Example: Disable specific dates
        locale: {
            firstDayOfWeek: 1 // Set Monday as the first day of the week
        },
        onChange: function(selectedDates, dateStr, instance) {
            console.log("Selected Date: ", dateStr); // For debugging
        }
    });

    const classFilters = document.querySelectorAll('.class-filter');
    const classListContainers = document.querySelectorAll('.class-select');
    const classChangePrevContainer = document.getElementById('prev-class-booked');
    const classChangeNewContainer = document.getElementById('new-class-booked');
    const termListContainer = document.getElementById('term-booked');
    const templateSelector = document.getElementById('email-template');

    // Fetch class data from classTimetable.json
    fetch('classTimetable.json')
    .then(response => response.json()) // Parse JSON data
    .then(classes => {
        let allClasses = classes.filter(c => c.active !== false); // Store all classes less any disabled classes
        // Call the function to populate the dropdown initially
        populateClassDropdown(allClasses);

        // Event listeners for filter fields
        document.getElementById('class-day').addEventListener('change', () => updateClassList(allClasses));
        document.getElementById('venue').addEventListener('change', () => updateClassList(allClasses));
        document.getElementById('class-type').addEventListener('change', () => updateClassList(allClasses));
        document.getElementById('class-age').addEventListener('change', () => updateClassList(allClasses));


        // Event listener for email template change
        templateSelector.addEventListener('change', () => updateClassList(allClasses));

        // Event listeners for class selection dropdowns
        classChangePrevContainer.addEventListener('change', () => {
            const selectedClass = classChangePrevContainer.value;
            document.getElementById('prev-class-selected').textContent = selectedClass ? `Selection: ${classChangePrevContainer.options[classChangePrevContainer.selectedIndex].text}` : 'Selection: None';
        });

        classChangeNewContainer.addEventListener('change', () => {
            const selectedClass = classChangeNewContainer.value;
            document.getElementById('new-class-selected').textContent = selectedClass ? `Selection: ${classChangeNewContainer.options[classChangeNewContainer.selectedIndex].text}` : 'Selection: None';
        });

        // Function to update class list based on filters
        function updateClassList(allClasses) {
            const selectedDay = document.getElementById('class-day').value;
            const selectedVenue = document.getElementById('venue').value;
            const selectedType = document.getElementById('class-type').value;
            const selectedAge = document.getElementById('class-age').value;
            const selectedTemplate = templateSelector.value;

            // Filter classes based on user input
            let filteredClasses = allClasses.filter(classItem => {
                return (
                    (selectedDay === "" || classItem.classDay === selectedDay) &&
                    (selectedVenue === "" || classItem.venueName === selectedVenue) &&
                    (selectedType === "" || classItem.classType === selectedType) &&
                    (selectedAge === "" || classItem.className === selectedAge)
                );
            });

            // If template is 'adv-rec-trial', filter for Advanced Rec classes only
            if (selectedTemplate === 'adv-rec-trial-invite' || selectedTemplate === 'adv-rec-trial-conf') {
                filteredClasses = filteredClasses.filter(c => c.classType === 'Advanced Recreational');
            }

            // Populate dropdown with filtered classes
            populateClassDropdown(filteredClasses);
        }

        // Function to populate the class dropdown
        function populateClassDropdown(allClasses) {
            classListContainers.forEach(container => {
                container.innerHTML = '';

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '--Select a class--';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                container.appendChild(defaultOption);

                if (allClasses.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No classes found';
                    container.appendChild(option);
                } else {
                    allClasses.forEach(classItem => {
                        const option = document.createElement('option');
                        option.value = classItem.classCode; // Assuming each class has a unique classCode
                        option.textContent = `${classItem.className}, ${classItem.classType} ${classItem.classSubtype ? '(' + classItem.classSubtype + ')' : ''} ${classItem.classDay}, ${classItem.classTime} (${classItem.venueName})`;
                        container.appendChild(option);
                    });
                }
            })
        }
    })
    .catch(error => {
        console.error('Error loading class data:', error);
    });

    // Fetch term data from termDates.json
    fetch('termDates.json')
    .then(response => response.json()) // Parse JSON data
    .then(terms => {
        // Filter out archived terms
        const visibleTerms = terms.filter(t => !t.archive);

        // Populate dropdown with visible terms
        populateTermDropdown(visibleTerms);
    })
    .catch(error => {
        console.error('Error loading term data:', error);
    });

    // Function to populate the term dropdown
    function populateTermDropdown(visibleTerms) {
        termListContainer.innerHTML = ''; // Clear previous options

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '--Select a term--';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        termListContainer.appendChild(defaultOption);

        visibleTerms.forEach(term => {
            const option = document.createElement('option');
            option.value = term.termName; // Unique identifier for each term

            const formattedStartDate = formatDate(term.startDate);
            const formattedEndDate = formatDate(term.endDate);

            // Build display text for dropdown list
            option.textContent = `${term.termName} (${formattedStartDate} - ${formattedEndDate})`;
            
            // Apply active/archive rules
            if (term.active === false) {
                option.disabled = true; // show option but not selectable
                option.textContent += ' (Inactive)';
            }
            
            termListContainer.appendChild(option);
        });
    }

    const generalEmailsForm = document.getElementById('general-emails-form-container');
    const recBookingEmailsForm = document.getElementById('rec-booking-emails-form-container');
    const newBookingsForm = document.getElementById('new-bookings-form-container'); // Inside recBookingEmailsForm
    const changingClassForm = document.getElementById('changing-class-form-container'); // Inside recBookingEmailsForm
    const advRecTrialForm = document.getElementById('trial-invitation-email-form-container'); // Inside recBookingEmailsForm
    const classFiltersContainer = document.getElementById('class-filters-container'); // Inside recBookingEmailsForm
    const termSelectionForm = document.getElementById('term-select-container'); // Inside newBookingsForm
    const trialDeadlineForm = document.getElementById('trial-deadline-container'); // Inside advRecTrialForm

    // Function to hide all email form fields
    function hideAllFields() {
        const allFormContainers = [generalEmailsForm, recBookingEmailsForm, newBookingsForm, termSelectionForm, advRecTrialForm, changingClassForm, classFiltersContainer, termSelectionForm, trialDeadlineForm];
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
    function showFields(...formContainers) {
        formContainers.forEach(formContainer => {
            formContainer.style.display = 'block';

            const fields = formContainer.querySelectorAll('input, select, textarea');
            fields.forEach(field => {
                field.disabled = false;
                field.required = true;
                field.value = '';
            });
        });
    }

    const emailTemplateContainer = document.getElementById('emailTemplate');
    const termSelector = document.getElementById('term-booked');
    const bookingStartDateInput = document.getElementById('booking-start-date');
    const classChangeDateInput = document.getElementById('class-change-start-date');
    const trialStartDateInput = document.getElementById('trial-class-date');
    const trialConfirmationDeadlineInput = document.getElementById('trial-confirmation-deadline');
    const generalMessageTitleInput = document.getElementById('messageTitle');
    const generalMessageContentInput = document.getElementById('messageContent');
    const generalMessageEmployeeName = document.getElementById('employeeName');
    const generalMessageSignatureInput = document.getElementById('messageSignature');

    // General message placeholders
    let placeholderGeneralMessageTitle = null;
    let placeholderGeneralMessageContent = null;
    let placeholderGeneralMessageEmployeeName = null;
    let placeholderGeneralMessageSignature = null;

    // Booking confirmation placeholders
    let placeholderClassData = null; // store the class data
    let placeholderPrevClassData = null;
    let placeholderNewClassData = null;
    let placeholderTermData = null;  // store the term data
    let placeholderBookingData = null; // store the booking data

    // Trial details placeholders
    let placeholderTrialData = null; // store the trial data

    // Generate email based on template selected
    templateSelector.addEventListener('change', () => {
        const selectedTemplate = templateSelector.value;

        // Reset filter, class, term & booking fields when a template selection is changed
        classFilters.forEach(filter => {
            filter.value = '';
        });
        classListContainers.forEach(container => {
            container.value = '';
        });
        termSelector.value = '';
        bookingStartDateInput.value = '';
        classChangeDateInput.value = '';
        trialStartDateInput.value = '';
        trialConfirmationDeadlineInput.value = '';

        // Reset the placeholders to empty (no previously selected values)
        placeholderGeneralMessageTitle = {};
        placeholderGeneralMessageEmployeeName = {};
        placeholderGeneralMessageSignature = {};
        placeholderGeneralMessageContent = {};
        placeholderClassData = {};
        placeholderPrevClassData = {};
        placeholderNewClassData = {};
        placeholderTermData = {};
        placeholderBookingData = {};
        placeholderTrialData = {};

        // Hide all form fields before showing the relevant ones
        hideAllFields();

        // Ensure class filters stay visible for the appropriate templates
        if (selectedTemplate === 'taster' || selectedTemplate === 'new-member' || selectedTemplate === 'auto-enrol' || selectedTemplate === 'changing-class') {
            showFields(classFiltersContainer);  // Keep class filters visible when needed
        }

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
                        showFields(recBookingEmailsForm, newBookingsForm, termSelectionForm);
                    } else if (selectedTemplate === 'changing-class') {
                        showFields(recBookingEmailsForm, changingClassForm);
                    } else if (selectedTemplate === 'adv-rec-trial-invite') {
                        showFields(advRecTrialForm, trialDeadlineForm);
                    } else if (selectedTemplate === 'adv-rec-trial-conf') {
                        showFields(advRecTrialForm);
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

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
    })

    generalMessageEmployeeName.addEventListener('input', () => {
        const employeeName = generalMessageEmployeeName.value || "";

        placeholderGeneralMessageEmployeeName = {
            employeeName: employeeName
        };

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
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

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
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

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
    })

    bookingStartDateInput.addEventListener('change', () => {
        const bookingStartDate = bookingStartDateInput.value;
        const formattedBookingStartDate = formatDate(bookingStartDate);
        placeholderBookingData = {
            bookingStartDate: formattedBookingStartDate
        };

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
    })

    classChangeDateInput.addEventListener('change', () => {
        const classChangeDate = classChangeDateInput.value;
        const formattedClassChangeDate = formatDate(classChangeDate);
        
        if (!placeholderNewClassData) {
            placeholderNewClassData = {};
        }

        placeholderNewClassData.classChangeDate = formattedClassChangeDate;

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
    })

    trialStartDateInput.addEventListener('change', () => {
        const trialStartDate = trialStartDateInput.value;
        const formattedTrialStartDate = formatDate(trialStartDate);

        if (!placeholderTrialData) {
            placeholderTrialData = {};
        }

        placeholderTrialData.trialStartDate = formattedTrialStartDate;

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
    })

    trialConfirmationDeadlineInput.addEventListener('change', () => {
        const trialConfirmationDeadline = trialConfirmationDeadlineInput.value;
        const formattedTrialConfirmationDeadline = formatDate(trialConfirmationDeadline);

        if (!placeholderTrialData) {
            placeholderTrialData = {};
        }

        placeholderTrialData.trialConfirmationDeadline = formattedTrialConfirmationDeadline;

        updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData
        )
    })

    // Combined function to format both date strings (DD/MM/YYYY) and ISO date strings (YYYY-MM-DD)
    function formatDate(dateStr) {
        // Return "tbc" directly if that's what the data says
        if (typeof dateStr === 'string' && dateStr.trim().toLowerCase() === 'tbc') {
            return 'tbc';
        }

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
            let allClasses = classes.filter(c => c.active !== false);

            classListContainers.forEach(container => {
                container.addEventListener('change', () => {
                    const selectedClassCode = container.value;

                    if (selectedClassCode) {
                        const selectedClass = allClasses.find(classItem => classItem.classCode === selectedClassCode);

                        if (selectedClass) {
                            fetch('venues.json')
                                .then(response => response.json())
                                .then(venues => {
                                    const selectedVenue = venues.find(venue => venue.venueName === selectedClass.venueName);

                                    if (container.id === 'class-booked') {
                                    
                                        placeholderClassData = {
                                            classType: selectedClass.classType || '',
                                            classSubtype: selectedClass.classSubtype || '',
                                            className: selectedClass.className || '',
                                            classAge: selectedClass.classAge || '',
                                            classDay: selectedClass.classDay || '',
                                            classTime: selectedClass.classTime || '',
                                            duration: selectedClass.duration || '',
                                            classMembership: selectedClass.classMembership || '',
                                            tasterPrice: selectedClass.tasterPrice || '',
                                            trialPrice: selectedClass.trialPrice || '',
                                            venueName: selectedClass.venueName || '',
                                            fullAddress: selectedVenue ? [selectedVenue.venueAddressLine1, selectedVenue.venueAddressLine2, selectedVenue.venueAddressLine3, selectedVenue.venueCityTown, selectedVenue.venuePostcode].filter(Boolean).join('<br>') : '',
                                        };
                                    } else if (container.id === 'prev-class-booked') {

                                        placeholderPrevClassData = {
                                            prevClassType: selectedClass.classType || '',
                                            prevClassSubtype: selectedClass.classSubtype || '',
                                            prevClassName: selectedClass.className || '',
                                            prevClassAge: selectedClass.classAge || '',
                                            prevClassDay: selectedClass.classDay || '',
                                            prevClassTime: selectedClass.classTime || '',
                                            prevDuration: selectedClass.duration || '',
                                            prevVenueName: selectedClass.venueName || '',
                                            prevFullAddress: selectedVenue ? [selectedVenue.venueAddressLine1, selectedVenue.venueAddressLine2, selectedVenue.venueAddressLine3, selectedVenue.venueCityTown, selectedVenue.venuePostcode].filter(Boolean).join('<br>') : '',
                                        };
                                    }  else if (container.id === 'new-class-booked') {

                                        if(!placeholderNewClassData) {
                                            placeholderNewClassData = {}
                                        };
                                        placeholderNewClassData.newClassType = selectedClass.classType || '',
                                        placeholderNewClassData.newClassSubtype = selectedClass.classSubtype || '',
                                        placeholderNewClassData.newClassName = selectedClass.className || '',
                                        placeholderNewClassData.newClassAge = selectedClass.classAge || '',
                                        placeholderNewClassData.newClassDay = selectedClass.classDay || '',
                                        placeholderNewClassData.newClassTime = selectedClass.classTime || '',
                                        placeholderNewClassData.newDuration = selectedClass.duration || '',
                                        placeholderNewClassData.newClassMembership = selectedClass.classMembership || '',
                                        placeholderNewClassData.newTasterPrice = selectedClass.tasterPrice || '',
                                        placeholderNewClassData.newVenueName = selectedClass.venueName || '',
                                        placeholderNewClassData.newFullAddress = selectedVenue ? [selectedVenue.venueAddressLine1, selectedVenue.venueAddressLine2, selectedVenue.venueAddressLine3, selectedVenue.venueCityTown, selectedVenue.venuePostcode].filter(Boolean).join('<br>') : '';
                                    } else if (container.id === 'trial-class-offered') {
                                        placeholderTrialData = {
                                            trialClassType: selectedClass.classType || '',
                                            trialClassName: selectedClass.className || '',
                                            trialClassAge: selectedClass.classAge || '',
                                            trialClassSchoolAge: selectedClass.classSchoolAge || '',
                                            trialClassDay: selectedClass.classDay || '',
                                            trialClassTime: selectedClass.classTime || '',
                                            trialClassDuration: selectedClass.duration || '',
                                            trialClassMembership: selectedClass.classMembership || '',
                                            trialClassTrialPrice: selectedClass.trialPrice || '',
                                            trialClassVenueName: selectedClass.venueName || '',
                                            trialClassFullAddress: selectedVenue ? [selectedVenue.venueAddressLine1, selectedVenue.venueAddressLine2, selectedVenue.venueAddressLine3, selectedVenue.venueCityTown, selectedVenue.venuePostcode].filter(Boolean).join('<br>') : '',
                                        }
                                    };

                                    updateEmailTemplate(
                                        placeholderGeneralMessageTitle,
                                        placeholderGeneralMessageEmployeeName,
                                        placeholderGeneralMessageSignature,
                                        placeholderGeneralMessageContent,
                                        placeholderClassData,
                                        placeholderPrevClassData,
                                        placeholderNewClassData,
                                        placeholderTermData,
                                        placeholderBookingData,
                                        placeholderTrialData
                                    );
                                })
                                .catch(error => console.error('Error loading venue data:', error));
                        }
                    }
                });
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
                        updateEmailTemplate(
                            placeholderGeneralMessageTitle,
                            placeholderGeneralMessageEmployeeName,
                            placeholderGeneralMessageSignature,
                            placeholderGeneralMessageContent,
                            placeholderClassData,
                            placeholderPrevClassData,
                            placeholderNewClassData,
                            placeholderTermData,
                            placeholderBookingData,
                            placeholderTrialData
                        );
                    }
                } else {
                    console.error('allTerms is not an array or selectedTermName is invalid');
                }
            });      
        })
        .catch(error => console.error('Error loading term data:', error));

        // Function to update email template content based on placeholders
        function updateEmailTemplate(
            placeholderGeneralMessageTitle,
            placeholderGeneralMessageEmployeeName,
            placeholderGeneralMessageSignature,
            placeholderGeneralMessageContent,
            placeholderClassData,
            placeholderPrevClassData,
            placeholderNewClassData,
            placeholderTermData,
            placeholderBookingData,
            placeholderTrialData) {
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
                    if (placeholderGeneralMessageEmployeeName) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderGeneralMessageEmployeeName, 'general-message');
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
                    if (placeholderPrevClassData) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderPrevClassData, 'prev-class');
                    }
                    if (placeholderNewClassData) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderNewClassData, 'new-class');
                    }
                    if (placeholderTermData) {
                        updatedTemplateContent = replacePlaceholders(updatedTemplateContent, placeholderTermData, 'term');
                    }
                    if (placeholderBookingData) {
                        updatedTemplateContent = replacePlaceholders (updatedTemplateContent, placeholderBookingData, 'booking');
                    }
                    if (placeholderTrialData) {
                        updatedTemplateContent = replacePlaceholders (updatedTemplateContent, placeholderTrialData, 'adv-trial');
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
                    .replace(/{{employeeName}}/g, placeholderData.employeeName || '{{employeeName}}')
                    .replace(/{{messageSignature}}/g, placeholderData.messageSignature || '{{messageSignature}}')
                    .replace(/{{messageContent}}/g, placeholderData.messageContent || '{{messageContent}}');
            } else if (dataType === 'SGBG-message') {
                return templateContent
            } else if (dataType === 'class') {
                return templateContent.replace(/{{classType}}/g, placeholderData.classType)
                    .replace(/{{classSubtype}}/g, placeholderData.classSubtype)
                    .replace(/{{className}}/g, placeholderData.className)
                    .replace(/{{classAge}}/g, placeholderData.classAge)
                    .replace(/{{classDay}}/g, placeholderData.classDay)
                    .replace(/{{classTime}}/g, placeholderData.classTime)
                    .replace(/{{duration}}/g, placeholderData.duration)
                    .replace(/{{classMembership}}/g, placeholderData.classMembership)
                    .replace(/{{tasterPrice}}/g, placeholderData.tasterPrice)
                    .replace(/{{trialPrice}}/g, placeholderData.trialPrice)
                    .replace(/{{venueName}}/g, placeholderData.venueName)
                    .replace(/{{fullAddress}}/g, placeholderData.fullAddress);
            } else if (dataType === 'prev-class') {
                return templateContent.replace(/{{prevClassType}}/g, placeholderData.prevClassType)
                    .replace(/{{prevClassSubtype}}/g, placeholderData.prevClassSubtype)
                    .replace(/{{prevClassName}}/g, placeholderData.prevClassName)
                    .replace(/{{prevClassAge}}/g, placeholderData.prevClassAge)
                    .replace(/{{prevClassDay}}/g, placeholderData.prevClassDay)
                    .replace(/{{prevClassTime}}/g, placeholderData.prevClassTime)
                    .replace(/{{prevDuration}}/g, placeholderData.prevDuration)
                    .replace(/{{prevVenueName}}/g, placeholderData.prevVenueName)
                    .replace(/{{prevFullAddress}}/g, placeholderData.prevFullAddress);
            } else if (dataType === 'new-class') {
                return templateContent.replace(/{{newClassType}}/g, placeholderData.newClassType)
                    .replace(/{{newClassSubtype}}/g, placeholderData.newClassSubtype)
                    .replace(/{{newClassName}}/g, placeholderData.newClassName)
                    .replace(/{{newClassAge}}/g, placeholderData.newClassAge)
                    .replace(/{{newClassDay}}/g, placeholderData.newClassDay)
                    .replace(/{{newClassTime}}/g, placeholderData.newClassTime)
                    .replace(/{{newDuration}}/g, placeholderData.newDuration)
                    .replace(/{{newClassMembership}}/g, placeholderData.newClassMembership)
                    .replace(/{{newTasterPrice}}/g, placeholderData.newTasterPrice)
                    .replace(/{{newVenueName}}/g, placeholderData.newVenueName)
                    .replace(/{{newFullAddress}}/g, placeholderData.newFullAddress)
                    .replace(/{{classChangeDate}}/g, placeholderData.classChangeDate);
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
            } else if (dataType === 'adv-trial') {
                return templateContent.replace(/{{trialStartDate}}/g, placeholderData.trialStartDate)
                .replace(/{{trialConfirmationDeadline}}/g, placeholderData.trialConfirmationDeadline)
                .replace(/{{trialClassType}}/g, placeholderData.trialClassType)
                .replace(/{{trialClassSubtype}}/g, placeholderData.trialClassSubtype)
                .replace(/{{trialClassName}}/g, placeholderData.trialClassName)
                .replace(/{{trialClassAge}}/g, placeholderData.trialClassAge)
                .replace(/{{trialClassSchoolAge}}/g, placeholderData.trialClassSchoolAge)
                .replace(/{{trialClassDay}}/g, placeholderData.trialClassDay)
                .replace(/{{trialClassTime}}/g, placeholderData.trialClassTime)
                .replace(/{{trialClassDuration}}/g, placeholderData.trialClassDuration)
                .replace(/{{trialClassMembership}}/g, placeholderData.trialClassMembership)
                .replace(/{{trialClassTrialPrice}}/g, placeholderData.trialClassTrialPrice)
                .replace(/{{trialClassVenueName}}/g, placeholderData.trialClassVenueName)
                .replace(/{{trialClassFullAddress}}/g, placeholderData.trialClassFullAddress);
            }
            return templateContent; // Return unchanged template if no valid data type
        }

});