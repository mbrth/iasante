
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { UserProfile, NutritionPlan, HealthMetrics } from "../types";

export const generateMedicalReport = (
  profile: UserProfile, 
  metrics: HealthMetrics[], 
  plan: NutritionPlan[] | null,
  riskData: any
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const date = new Date().toLocaleDateString('fr-FR');
  
  // --- DESIGN SYSTEM ---
  const PRIMARY_COLOR = [5, 150, 105]; // Emerald 600
  const DARK_COLOR = [15, 23, 42]; // Slate 900
  const LIGHT_TEXT = [148, 163, 184]; // Slate 400
  
  // --- HEADER ---
  // Background rectangle
  doc.setFillColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NutriPath AI", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("PROTOCOLE DE NUTRITION CLINIQUE", 20, 32);
  
  doc.setFontSize(9);
  doc.text(`Édité le : ${date}`, pageWidth - 60, 25);
  doc.text(`ID Patient: NP-${Math.floor(Math.random() * 90000 + 10000)}`, pageWidth - 60, 32);

  // --- SECTION 1: PROFIL PATIENT ---
  let cursorY = 55;
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("1. INFORMATIONS PATIENT", 20, cursorY);
  
  cursorY += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, cursorY - 5, pageWidth - 20, cursorY - 5);

  const profileData = [
    ["Âge", `${profile.age} ans`, "Sexe", profile.sex],
    ["Taille", `${profile.height} cm`, "Poids", `${profile.weight} kg`],
    ["IMC", profile.bmi.toFixed(1), "Statut", "Actif"],
  ];

  (doc as any).autoTable({
    startY: cursorY,
    head: [],
    body: profileData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: LIGHT_TEXT },
      1: { textColor: DARK_COLOR },
      2: { fontStyle: 'bold', textColor: LIGHT_TEXT },
      3: { textColor: DARK_COLOR },
    },
    margin: { left: 20 }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 15;

  // --- SECTION 2: ÉTAT CLINIQUE ---
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("2. DOSSIER CLINIQUE", 20, cursorY);
  cursorY += 10;

  const clinicalData = [
    ["Pathologies", profile.pathologies.join(", ") || "Néant"],
    ["Traitements", profile.treatments.join(", ") || "Aucun traitement renseigné"],
    ["Allergies", profile.allergies.join(", ") || "Aucune allergie connue"],
  ];

  (doc as any).autoTable({
    startY: cursorY,
    head: [["CATÉGORIE", "DÉTAILS MÉDICAUX"]],
    body: clinicalData,
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: 20, right: 20 }
  });

  cursorY = (doc as any).lastAutoTable.finalY + 15;

  // --- SECTION 3: ANALYSE IA & SCORES ---
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("3. ANALYSE ET SCORE DE SANTÉ", 20, cursorY);
  cursorY += 8;

  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.setFontSize(10);
  doc.text(`Score de Santé Global : ${riskData?.healthScore || 85}/100`, 20, cursorY);
  
  cursorY += 7;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const splitFeedback = doc.splitTextToSize(`Recommandation IA : "${riskData?.aiFeedback || "Maintenir le protocole actuel."}"`, pageWidth - 40);
  doc.text(splitFeedback, 20, cursorY);
  cursorY += (splitFeedback.length * 5) + 5;

  // --- SECTION 4: RÉSUMÉ NUTRITIONNEL ---
  if (plan && plan.length > 0) {
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("4. RÉSUMÉ DU PROTOCOLE NUTRITIONNEL", 20, cursorY);
    cursorY += 10;

    const planSummary = plan.slice(0, 3).map(p => [
      p.day,
      `${p.totalCalories} kcal`,
      p.meals.map(m => m.name).join(", ").substring(0, 80) + "..."
    ]);

    (doc as any).autoTable({
      startY: cursorY,
      head: [["JOUR", "CALORIES CIBLES", "EXEMPLE DE REPAS"]],
      body: planSummary,
      headStyles: { fillColor: DARK_COLOR, textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 }
    });
  }

  // --- FOOTER / DISCLAIMER ---
  const footerY = doc.internal.pageSize.getHeight() - 25;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, footerY, pageWidth - 20, footerY);
  
  doc.setFontSize(7);
  doc.setTextColor(LIGHT_TEXT[0], LIGHT_TEXT[1], LIGHT_TEXT[2]);
  doc.setFont("helvetica", "normal");
  const disclaimer = "AVERTISSEMENT : Ce rapport est généré par une intelligence artificielle à titre informatif. Il ne remplace en aucun cas un avis médical, un diagnostic ou un traitement professionnel. Consultez toujours un médecin avant de modifier votre régime alimentaire ou vos traitements.";
  const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 40);
  doc.text(splitDisclaimer, pageWidth / 2, footerY + 8, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.text("© 2025 NutriPath AI - Excellence en Nutrition Clinique", pageWidth / 2, footerY + 18, { align: "center" });

  // SAVE
  doc.save(`NutriPath_Report_${date.replace(/\//g, '-')}.pdf`);
};
