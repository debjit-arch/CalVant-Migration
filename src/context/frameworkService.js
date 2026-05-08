// services/frameworkService.js
const BASE_URL = "https://api.calvant.com/framework/api/frameworks";
const ORG_BASE_URL = "https://api.calvant.com/user-service/api/organizations";

export const FRAMEWORK_CONFIG = {
  ISO27001: {
    label: "ISO 27001",
    color: "#0066cc",
    path: "/iso-27001",
    sub: "Information Security",
    description: "Information Security Management",
    riskTypes: ["Security", "Cyber", "Fraud"],
    annexSectionTypes: ["ANNEX_A"],
    isMapped: false,
    mappingSources: [],
  },

  ISO27701: {
    label: "ISO 27701",
    color: "#00a3ff",
    path: "/iso-27701",
    sub: "Privacy",
    description: "Privacy Information Management",
    riskTypes: ["Privacy"],
    annexSectionTypes: ["Annex_A", "Annex_B", "Annex_A_Security"],
    isMapped: false,
    mappingSources: [],
  },

  SOC2: {
    label: "SOC 2",
    color: "#ff9900",
    path: "/soc-2",
    sub: "Trust Services",
    description: "Trust Services Criteria",
    riskTypes: ["Security", "Cyber", "Privacy"],
    annexSectionTypes: ["COMMON_CRITERIA", "ADDITIONAL_CRITERIA"],
    isMapped: true,
    mappingSources: ["ISO27001", "ISO27701"],
  },

  ISO42001: {
    label: "ISO 42001",
    color: "#10b981",
    path: "/iso-42001",
    sub: "AI Management",
    description: "AI Management System",
    riskTypes: ["Artificial Intelligence"],
    annexSectionTypes: ["ANNEX_A", "ANNEX_B", "CORE"],
    isMapped: false,
    mappingSources: [],
  },

  KSA_PDPL: {
    label: "KSA PDPL",
    color: "#1078b9",
    path: "/ksa-pdpl",
    sub: "Saudi Data Protection",
    description: "Personal Data Protection Law",
    riskTypes: ["Privacy"],
    annexSectionTypes: ["GENERAL_PROVISIONS"],
    isMapped: true,
    mappingSources: ["ISO27001", "ISO27701", "SOC2"],
  },

  GDPR: {
    label: "GDPR",
    color: "#1078b9",
    path: "/gdpr",
    sub: "Global Data Protection Regulation",
    description: "General Data Protection Regulation",
    riskTypes: ["Privacy"],
    annexSectionTypes: [],
    isMapped: true,
    mappingSources: ["ISO27701", "KSA_PDPL", "SOC2", "ISO27001"],
  },

  DPDPA: {
    label: "DPDPA",
    color: "#ff6b35",
    path: "/dpdpa",
    sub: "India Data Protection",
    description: "Digital Personal Data Protection Act, 2023",
    riskTypes: ["Privacy"],
    annexSectionTypes: ["OBLIGATIONS", "RIGHTS", "COMPLIANCE"],
    isMapped: true,
    mappingSources: ["ISO27701"],
  },
};

export const FRAMEWORK_TILE_COLORS = {
  ISO27001: "#1565c0",
  ISO27701: "#6a1b9a",
  SOC2: "#1b5e20",
  ISO42001: "#e65100",
  KSA_PDPL: "#c2410c",
};

const fetchOrgFrameworks = async (organizationId, token) => {
  console.log("[frameworkService] Calling org API with:", {
    url: `${ORG_BASE_URL}/${organizationId}`,
    tokenPreview: token ? `${token.substring(0, 20)}...` : "MISSING",
  });

  const res = await fetch(`${ORG_BASE_URL}/${organizationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok)
    throw new Error(`Failed to fetch organization: ${organizationId}`);
  const org = await res.json();
  return Array.isArray(org.frameworks)
    ? org.frameworks.map((code) => code.toUpperCase())
    : [];
};

export const fetchFrameworks = async () => {
  let user;
  try {
    user = JSON.parse(sessionStorage.getItem("user"));
  } catch {
    throw new Error("[frameworkService] Failed to parse user from sessionStorage");
  }

  const organizationId = user?.organization;
  
  // Try all possible token locations
  const token =
    typeof user?.token === "string"
      ? user.token
      : user?.token?.token
      ?? sessionStorage.getItem("token");

  console.log("[frameworkService] user object:", user);
  console.log("[frameworkService] organizationId:", organizationId);
  console.log("[frameworkService] token (first 30):", token?.substring(0, 30));

  if (!organizationId) throw new Error("[frameworkService] user.organization missing");
  if (!token) throw new Error("[frameworkService] No token found");

  const [allFrameworks, orgFrameworkCodes] = await Promise.all([
    fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch frameworks");
      return res.json();
    }),
    fetchOrgFrameworks(organizationId, token),
  ]);

  // 🔍 KEY LOGS — paste these results
  console.log("[frameworkService] allFrameworks raw:", allFrameworks);
  console.log("[frameworkService] allFrameworks codes:", allFrameworks.map((fw) => fw.code));
  console.log("[frameworkService] orgFrameworkCodes:", orgFrameworkCodes);
  console.log("[frameworkService] filter check:", allFrameworks.map((fw) => ({
    code: fw.code,
    codeUpper: fw.code?.toUpperCase(),
    inOrg: orgFrameworkCodes.includes(fw.code?.toUpperCase()),
  })));

  const filtered = allFrameworks
    .filter((fw) => orgFrameworkCodes.includes(fw.code?.toUpperCase()))
    .map((fw) => {
      const config = FRAMEWORK_CONFIG[fw.code];
      if (!config) {
        console.warn(`[frameworkService] Unknown framework code: "${fw.code}"`);
        return null;
      }
      return {
        id: config.label,
        code: fw.code,
        label: config.label,
        color: config.color,
        path: config.path,
        description: config.description,
        riskTypes: config.riskTypes,
        annexSectionTypes: config.annexSectionTypes,
        isMapped: config.isMapped,
        mappingSources: config.mappingSources,
      };
    })
    .filter(Boolean);

  console.log("[frameworkService] final filtered frameworks:", filtered);
  return filtered;
};
