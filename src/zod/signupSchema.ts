import z from "zod";

export const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
    branchId: z.string().min(1, "Branch is required"),
    divisionId: z.string().min(1, "Division is required"),
    semester: z.string().min(1, "Semester is required"),
    sapId: z
        .string()
        .regex(/^\d{11}$/, "SAP ID must be exactly 11 digits"),

    rollNo: z
        .string()
        .regex(
            /^[A-Za-z][0-9]{3}$/,
            "Roll No must be 1 alphabet followed by 000-999 (e.g. D000, D123)"
        ),
    subDivisionId: z.string().min(1, "Sub Division is required"),
    electiveChoice1: z.string().min(1, "Elective Choice 1 is required"),
    electiveChoice2: z.string().min(1, "Elective Choice 2 is required"),
});