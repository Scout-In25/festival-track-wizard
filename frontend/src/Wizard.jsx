import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest, getApiBaseUrl } from "./apiUtils";

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

// A basic schema that allows all fields to be optional for now.
// This will be refined as we implement step-by-step validation.
const dynamicSchema = z.object(
  questionnaire.reduce((acc, q) => {
    acc[q.fieldName] = q.type === "multiselect" ? z.array(z.string()).optional() : z.string().optional();
    return acc;
  }, {})
);

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: questionnaire.reduce((acc, q) => {
      acc[q.fieldName] = q.type === "multiselect" ? [] : "";
      return acc;
    }, {}),
  });

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

  const onSubmit = async (data) => {
    // This will be the final submission logic
    console.log("Form submitted:", data);
    
    try {
      // Use the API utility to make the request with proper headers
      const baseUrl = getApiBaseUrl();
      await apiRequest('post', `${baseUrl}/REST/formsubmit/`, data);
      alert("Schedule submitted!");
    } catch (err) {
      alert(err.message);
      console.error("Submission error:", err);
    }
  };

  const handleNext = (event) => {
    event.preventDefault(); // Prevent default form submission
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto p-4 bg-white rounded-xl shadow space-y-4">
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
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded ml-auto">
            Submit
          </button>
        )}
      </div>
    </form>
  );
}
