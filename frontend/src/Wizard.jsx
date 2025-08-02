import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDataContext } from './contexts/DataProvider';
import { participantsService } from './services/api/participantsService';
import { useToast } from './hooks/useToast';

const questionnaire = [
  {
    id: "roles",
    question: "Welke rol(len) heb jij?",
    type: "multiselect",
    fieldName: "roles",
    options: [
      { label: "Leiding", value: "leiding" },
      { label: "Bestuur of bestuursondersteuning", value: "bestuur" },
      { label: "Praktijkbelgeleider", value: "praktijkbegeleider" },
      { label: "Groepsbegeleider", value: "groepsbegeleider" },
      { label: "Vertrouwenspersoon", value: "vertrouwenspersoon" },
      { label: "Trainer / Praktijkcoach", value: "trainer_praktijkcoach" },
      { label: "Activiteitenteam regio", value: "activiteitenteam_regio" },
      { label: "Landelijk vrijwilliger", value: "landelijk_vrijwilliger" },
    ],
  },
  {
    id: "speltak_leiding",
    question: "Van welke speltak ben jij leiding?",
    type: "multiselect",
    fieldName: "speltakLeiding",
    dependsOn: { questionId: "roles", value: "leiding" },
    options: [
      { label: "Bevers", value: "bevers" },
      { label: "Welpen", value: "welpen" },
      { label: "Scouts", value: "scouts" },
      { label: "Explorers", value: "explorers" },
    ],
  },
  {
    id: "bestuur_rol",
    question: "Welke rol heb je in het bestuur?",
    type: "singleselect",
    fieldName: "bestuurRol",
    dependsOn: { questionId: "roles", value: "bestuur" },
    options: [
      { label: "Voorzitter", value: "voorzitter" },
      { label: "Secretaris", value: "secretaris" },
      { label: "Penningmeester", value: "penningmeester" },
      { label: "Materiaalbeheer", value: "materiaalbeheer" },
      { label: "Gebouwbeheer", value: "gebouwbeheer" },
      { label: "Communicatie", value: "communicatie" },
      { label: "Algemeen bestuurslid", value: "algemeen_bestuurslid" },
    ],
  },
  {
    id: "vrijwilliger_duur",
    question: "Hoe lang ben jij al vrijwilliger bij Scouting?",
    type: "singleselect",
    fieldName: "vrijwilligerDuur",
    options: [
      { label: "Nog niet zo lang (0-2 jaar)", value: "beginnend" },
      { label: "Al best wel even (2-5 jaar)", value: "gemiddeld" },
      { label: "Ik ga al even mee (5+ jaar)", value: "ervaren" },
    ],
  },
  {
    id: "activiteitengebieden",
    question: "Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)?",
    type: "multiselect",
    fieldName: "activiteitengebieden",
    maxSelections: 3,
    options: [
      { label: "Veilig en gezond", value: "veilig_gezond" },
      { label: "Identiteit", value: "identiteit" },
      { label: "Expressies", value: "expressies" },
      { label: "Uitdagende Scoutingtechnieken", value: "uitdagende_scoutingtechnieken" },
      { label: "Internationaal", value: "internationaal" },
      { label: "Sport en Spel", value: "sport_spel" },
      { label: "Samenleving", value: "samenleving" },
      { label: "Buitenleven", value: "buitenleven" },
    ],
  },
  {
    id: "onderwerpen",
    question: "Welke onderwerpen spreken je aan?",
    type: "multiselect",
    fieldName: "onderwerpen",
    options: [
      { label: "Sociale veiligheid", value: "sociale_veiligheid" },
      { label: "Mentale gezondheid", value: "mentale_gezondheid" },
      { label: "Insignes", value: "insignes" },
      { label: "EHBO", value: "ehbo" },
      { label: "Duurzaamheid", value: "duurzaamheid" },
      { label: "Groepsontwikkeling", value: "groepsontwikkeling" },
      { label: "Primitieve Scoutingtechnieken", value: "primitieve_scoutingtechnieken" },
    ],
  },
];

// Schema with validation for required fields
const dynamicSchema = z.object(
  questionnaire.reduce((acc, q) => {
    // Handle multiselect fields
    if (q.type === "multiselect") {
      if (q.fieldName === "roles") {
        acc[q.fieldName] = z.array(z.string()).min(1, "Selecteer minimaal één rol");
      } else if (q.fieldName === "activiteitengebieden") {
        acc[q.fieldName] = z.array(z.string())
          .min(1, "Selecteer minimaal 1 optie")
          .max(3, "Selecteer maximaal 3 opties");
      } else if (q.fieldName === "onderwerpen") {
        acc[q.fieldName] = z.array(z.string()).min(1, "Selecteer minimaal één optie");
      } else if (q.dependsOn) {
        // Conditional multiselect fields are optional in schema but validated when visible
        acc[q.fieldName] = z.array(z.string()).optional();
      } else {
        acc[q.fieldName] = z.array(z.string()).min(1, "Selecteer minimaal één optie");
      }
    } 
    // Handle single select fields
    else if (q.type === "singleselect") {
      if (q.dependsOn) {
        // Conditional fields are optional in the schema but will be validated when visible
        acc[q.fieldName] = z.string().optional();
      } else {
        acc[q.fieldName] = z.string().min(1, "Maak een keuze");
      }
    } 
    // Default case
    else {
      acc[q.fieldName] = z.string().optional();
    }
    return acc;
  }, {})
);

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { wordpressUser, isUserLoggedIn, userProfileLoading } = useDataContext();
  const { showInfo, showError } = useToast();
  const { register, handleSubmit, watch, formState: { errors }, trigger, setError } = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: questionnaire.reduce((acc, q) => {
      acc[q.fieldName] = q.type === "multiselect" ? [] : "";
      return acc;
    }, {}),
  });

  // Debug: Check if participantsService is available
  console.log("participantsService available:", !!participantsService);
  console.log("participantsService.create available:", !!participantsService?.create);

  const currentQuestion = questionnaire[currentStep];
  const allFormValues = watch(); // Watch all form values to check dependencies

  // Function to determine if a question should be shown
  const shouldShowQuestion = (question) => {
    if (!question.dependsOn) {
      return true; // Always show if no dependency
    }
    const dependentValue = allFormValues[question.dependsOn.questionId];
    if (Array.isArray(dependentValue)) {
      return dependentValue.includes(question.dependsOn.value);
    }
    return dependentValue === question.dependsOn.value;
  };

  // Filter visible questions based on dependencies
  const visibleQuestions = questionnaire.filter(shouldShowQuestion);
  const currentVisibleQuestionIndex = visibleQuestions.findIndex(q => q.id === currentQuestion.id);

  // Focus management: move focus to first form field when question changes
  useEffect(() => {
    // Small timeout to ensure DOM has updated after step change
    const timer = setTimeout(() => {
      // Find the first input element (radio button, checkbox) in the current question
      const firstInput = document.querySelector('fieldset input[type="radio"], fieldset input[type="checkbox"]');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const onSubmit = async (data) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data received:", data);
    console.log("WordPress user data:", wordpressUser);
    
    try {
      // Check if user data is available
      if (!wordpressUser) {
        console.error("WordPress user data is missing");
        throw new Error("Gebruikersgegevens niet beschikbaar. Ververs de pagina.");
      }
      
      // Extract all form values into labels array
      const labels = [];
      
      // Add multiselect values
      if (data.roles?.length) labels.push(...data.roles);
      if (data.speltakLeiding?.length) labels.push(...data.speltakLeiding);
      if (data.activiteitengebieden?.length) labels.push(...data.activiteitengebieden);
      if (data.onderwerpen?.length) labels.push(...data.onderwerpen);
      
      // Add single select values
      if (data.bestuurRol) labels.push(data.bestuurRol);
      if (data.vrijwilligerDuur) labels.push(data.vrijwilligerDuur);

      console.log("Extracted labels from form:", labels);

      // Get ticket type from user data
      const ticketType = wordpressUser.ticketType || wordpressUser.ticket_type || "standard";

      console.log("Ticket type from user data:", ticketType);

      // Create participant payload
      const participantData = {
        username: wordpressUser.username,
        first_name: wordpressUser.first_name || "",
        last_name: wordpressUser.last_name || "", 
        email: wordpressUser.email,
        track_id: null,
        ticket_type: ticketType,
        labels: labels,
        track: null,
        activities: [],
        reviews: []
      };

      console.log("WordPress user field mapping:");
      console.log("- username:", wordpressUser.username);
      console.log("- first_name:", wordpressUser.first_name);
      console.log("- last_name:", wordpressUser.last_name);
      console.log("- email:", wordpressUser.email);

      console.log("=== SUBMITTING PAYLOAD ===");
      console.log("Payload to be sent:", JSON.stringify(participantData, null, 2));
      
      // Submit to participants API
      console.log("Calling participantsService.create...");
      const result = await participantsService.create(participantData);
      console.log("API call successful:", result);
      
      showInfo("Profiel succesvol aangemaakt!");
      
      // Redirect to track page
      window.location.hash = '#track';
      
    } catch (err) {
      console.error("=== FORM SUBMISSION ERROR ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      if (err.response) {
        console.error("API Response:", err.response);
        console.error("API Response data:", err.response.data);
        console.error("API Response status:", err.response.status);
      }
      
      // Extract error code if it's a validation error
      let errorMessage = "Submission failed";
      if (err.message.includes("Validation error")) {
        // Extract the error code (422) from the response if available
        errorMessage = "Submission failed (Error 422)";
      } else if (err.response?.status) {
        errorMessage = `Submission failed (Error ${err.response.status})`;
      }
      
      showError(errorMessage);
    }
  };

  const handleNext = async (event) => {
    event.preventDefault(); // Prevent default form submission
    
    // For conditional fields, we need to check if they should be validated
    if (currentQuestion.dependsOn && shouldShowQuestion(currentQuestion)) {
      // For conditional single select fields, check if a value is selected
      if (currentQuestion.type === "singleselect") {
        const currentValue = allFormValues[currentQuestion.fieldName];
        if (!currentValue || currentValue === "") {
          setError(currentQuestion.fieldName, { 
            type: "manual", 
            message: "Maak een keuze" 
          });
          return;
        }
      }
      // For conditional multiselect fields, check if at least one is selected
      else if (currentQuestion.type === "multiselect") {
        const currentValue = allFormValues[currentQuestion.fieldName];
        if (!currentValue || currentValue.length === 0) {
          setError(currentQuestion.fieldName, { 
            type: "manual", 
            message: "Selecteer minimaal één optie" 
          });
          return;
        }
      }
    }
    
    // Validate the current field before moving to the next question
    const isValid = await trigger(currentQuestion.fieldName);
    
    if (!isValid) {
      // If validation fails, don't proceed to the next question
      return;
    }
    
    // Find the next visible question
    const nextQuestionIndex = visibleQuestions.findIndex((q, index) => index > currentVisibleQuestionIndex && shouldShowQuestion(q));
    if (nextQuestionIndex !== -1) {
      setCurrentStep(questionnaire.indexOf(visibleQuestions[nextQuestionIndex]));
    }
  };

  const handleBack = () => {
    // Find the previous visible question
    const prevQuestionIndex = visibleQuestions.slice(0, currentVisibleQuestionIndex).reverse().findIndex(shouldShowQuestion);
    if (prevQuestionIndex !== -1) {
      setCurrentStep(questionnaire.indexOf(visibleQuestions[currentVisibleQuestionIndex - (prevQuestionIndex + 1)]));
    } else {
      setCurrentStep(0); // Go to the first question if no previous visible question
    }
  };

  const renderQuestion = (question) => {
    switch (question.type) {
      case "multiselect":
        return (
          <fieldset>
            <legend className="font-semibold">{question.question}</legend>
            {question.options.map((option) => (
              <label key={option.value} className="block">
                <input
                  type="checkbox"
                  value={option.value}
                  {...register(question.fieldName)}
                />{" "}
                {option.label}
              </label>
            ))}
            {errors[question.fieldName] && (
              <p className="text-red-500">{errors[question.fieldName].message}</p>
            )}
          </fieldset>
        );
      case "singleselect":
        return (
          <fieldset>
            <legend className="font-semibold">{question.question}</legend>
            {question.options.map((option) => (
              <label key={option.value} className="block">
                <input
                  type="radio"
                  value={option.value}
                  {...register(question.fieldName)}
                />{" "}
                {option.label}
              </label>
            ))}
            {errors[question.fieldName] && (
              <p className="text-red-500">{errors[question.fieldName].message}</p>
            )}
          </fieldset>
        );
      default:
        return <p>Unknown question type</p>;
    }
  };

  // Loading state while user data is being fetched
  if (userProfileLoading) {
    return (
      <div className="max-w-lg mx-auto p-4 bg-white rounded-xl shadow space-y-4">
        <h2 className="text-2xl font-bold">Festival Track Wizard</h2>
        <p>Gebruikersgegevens laden...</p>
      </div>
    );
  }

  // Check if user is logged in
  if (!isUserLoggedIn) {
    return (
      <div className="max-w-lg mx-auto p-4 bg-white rounded-xl shadow space-y-4">
        <h2 className="text-2xl font-bold">Festival Track Wizard</h2>
        <p>Je moet ingelogd zijn om deze wizard te gebruiken.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => {
      console.log("Form onSubmit triggered");
      console.log("Current form errors:", errors);
      return handleSubmit(onSubmit)(e);
    }} className="max-w-lg mx-auto p-4 bg-white rounded-xl shadow space-y-4">
      <h2 className="text-2xl font-bold">Festival Track Wizard</h2>

      {renderQuestion(currentQuestion)}

      <div className="flex justify-between mt-4">
        {currentStep > 0 && (
          <button type="button" onClick={handleBack} className="bg-gray-300 text-gray-800 px-4 py-2 rounded">
            Back
          </button>
        )}
        {currentVisibleQuestionIndex < visibleQuestions.length - 1 ? (
          <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded ml-auto">
            Next
          </button>
        ) : (
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded ml-auto"
            onClick={() => console.log("Submit button clicked")}
          >
            Submit
          </button>
        )}
      </div>
    </form>
  );
}
