import type { QuestionField } from "./questions";

/**
 * Extract multiple fields from a single natural answer
 * Example: "I'm Tanush from Mumbai, I'm a student"
 * Extracts: name=Tanush, location=Mumbai, India, status=student
 */

export type ExtractedField = {
  field: QuestionField;
  value: string;
  confidence: number;
};

export function extractMultipleFields(answer: string, currentField?: QuestionField): ExtractedField[] {
  const extracted: ExtractedField[] = [];
  const normalized = answer.toLowerCase();

  // Extract name patterns
  const nameMatch = answer.match(/(?:i'm|i am|my name is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && currentField !== "name") {
    extracted.push({
      field: "name",
      value: nameMatch[1].trim(),
      confidence: 0.8,
    });
  }

  // Extract location
  const locationPatterns = [
    /(?:from|in|based in|located in|building from)\s+([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+)?)/i,
  ];
  for (const pattern of locationPatterns) {
    const match = answer.match(pattern);
    if (match && currentField !== "location") {
      extracted.push({
        field: "location",
        value: match[1].trim(),
        confidence: 0.7,
      });
      break;
    }
  }

  // Extract status
  if (/(student|studying)/i.test(answer) && currentField !== "status") {
    extracted.push({
      field: "status",
      value: "student",
      confidence: 0.9,
    });
  } else if (/(working|employed|professional|job)/i.test(answer) && currentField !== "status") {
    extracted.push({
      field: "status",
      value: "working professional",
      confidence: 0.8,
    });
  } else if (/(founder|entrepreneur|building|startup)/i.test(answer) && currentField !== "status") {
    extracted.push({
      field: "status",
      value: "founder",
      confidence: 0.8,
    });
  } else if (/(freelanc|independent|self.employed)/i.test(answer) && currentField !== "status") {
    extracted.push({
      field: "status",
      value: "freelancer",
      confidence: 0.8,
    });
  }

  // Extract hours per week
  const hoursMatch = answer.match(/(\d+)\s*(?:hours?|hrs?)(?:\s*(?:per|a|\/)\s*week)?/i);
  if (hoursMatch && currentField !== "hoursPerWeek") {
    extracted.push({
      field: "hoursPerWeek",
      value: hoursMatch[1],
      confidence: 0.8,
    });
  }

  // Extract budget
  if (/(?:₹|rupees?|rs\.?)\s*([0-9,]+)/i.test(answer) && currentField !== "budget") {
    const budgetMatch = answer.match(/(?:₹|rupees?|rs\.?)\s*([0-9,]+)/i);
    if (budgetMatch) {
      const amount = budgetMatch[1].replace(/,/g, "");
      let budgetRange = "unclear";
      const num = parseInt(amount, 10);
      if (num === 0) budgetRange = "₹0 / no budget";
      else if (num < 5000) budgetRange = "under ₹5,000";
      else if (num < 25000) budgetRange = "₹5,000–₹25,000";
      else budgetRange = "₹25,000+";

      extracted.push({
        field: "budget",
        value: budgetRange,
        confidence: 0.7,
      });
    }
  } else if (/(no budget|zero|nothing|broke|₹0)/i.test(answer) && currentField !== "budget") {
    extracted.push({
      field: "budget",
      value: "₹0 / no budget",
      confidence: 0.9,
    });
  }

  // Extract team status
  if (/(solo|alone|by myself|just me)/i.test(answer) && currentField !== "teamStatus") {
    extracted.push({
      field: "teamStatus",
      value: "solo",
      confidence: 0.9,
    });
  } else if (/(co.?founder|team|partner|with)/i.test(answer) && currentField !== "teamStatus") {
    extracted.push({
      field: "teamStatus",
      value: "with team",
      confidence: 0.7,
    });
  }

  // Extract stage
  if (/(no idea|don't know what|not sure what|exploring)/i.test(normalized) && currentField !== "stage") {
    extracted.push({
      field: "stage",
      value: "no idea yet",
      confidence: 0.9,
    });
  } else if (/(rough idea|concept|thought about)/i.test(normalized) && currentField !== "stage") {
    extracted.push({
      field: "stage",
      value: "rough idea",
      confidence: 0.8,
    });
  } else if (/(started building|building|working on)/i.test(normalized) && currentField !== "stage") {
    extracted.push({
      field: "stage",
      value: "started building",
      confidence: 0.8,
    });
  } else if (/(mvp|prototype|working version)/i.test(normalized) && currentField !== "stage") {
    extracted.push({
      field: "stage",
      value: "MVP exists",
      confidence: 0.8,
    });
  } else if (/(users|customers|people using)/i.test(normalized) && currentField !== "stage") {
    extracted.push({
      field: "stage",
      value: "users exist",
      confidence: 0.7,
    });
  }

  return extracted;
}

/**
 * Merge extracted fields with existing data
 */
export function mergeExtractedFields(
  existing: Record<string, unknown>,
  extracted: ExtractedField[]
): Record<string, unknown> {
  const merged = { ...existing };

  for (const field of extracted) {
    // Only add if not already set and confidence is reasonable
    if (!merged[field.field] && field.confidence >= 0.7) {
      merged[field.field] = field.value;
    }
  }

  return merged;
}

/**
 * Generate confirmation message for pre-extracted fields
 */
export function generateConfirmationMessage(fields: ExtractedField[]): string | null {
  if (fields.length === 0) return null;

  const descriptions: string[] = [];
  for (const field of fields) {
    if (field.confidence < 0.7) continue;

    switch (field.field) {
      case "name":
        descriptions.push(`your name as ${field.value}`);
        break;
      case "location":
        descriptions.push(`your location as ${field.value}`);
        break;
      case "status":
        descriptions.push(`you're a ${field.value}`);
        break;
      case "hoursPerWeek":
        descriptions.push(`${field.value} hours per week`);
        break;
      case "budget":
        descriptions.push(`budget: ${field.value}`);
        break;
      case "teamStatus":
        descriptions.push(`building ${field.value}`);
        break;
      case "stage":
        descriptions.push(`stage: ${field.value}`);
        break;
    }
  }

  if (descriptions.length === 0) return null;

  return `Got it. I have ${descriptions.join(", ")}. Correct?`;
}
