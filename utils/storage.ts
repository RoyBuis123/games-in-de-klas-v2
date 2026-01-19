import { GameConfig, StudentData } from "../types";
import { INITIAL_GAMES_CONFIG } from "../constants";

const STORAGE_KEYS = {
  TEACHER_PASSWORD: 'teacherPassword',
  GAMES_CONFIG: 'gamesConfig',
  ALL_STUDENTS: 'allStudents',
  STUDENT_PREFIX: 'student_',
};

export const getTeacherPassword = (): string => {
  return localStorage.getItem(STORAGE_KEYS.TEACHER_PASSWORD) || 'admin123';
};

export const setTeacherPassword = (password: string): void => {
  localStorage.setItem(STORAGE_KEYS.TEACHER_PASSWORD, password);
};

export const getGamesConfig = (): GameConfig => {
  const data = localStorage.getItem(STORAGE_KEYS.GAMES_CONFIG);
  return data ? JSON.parse(data) : INITIAL_GAMES_CONFIG;
};

export const saveGamesConfig = (config: GameConfig): void => {
  localStorage.setItem(STORAGE_KEYS.GAMES_CONFIG, JSON.stringify(config));
};

export const getStudentData = (studentId: string): StudentData | null => {
  const data = localStorage.getItem(`${STORAGE_KEYS.STUDENT_PREFIX}${studentId}`);
  return data ? JSON.parse(data) : null;
};

export const saveStudentData = (student: StudentData): void => {
  localStorage.setItem(`${STORAGE_KEYS.STUDENT_PREFIX}${student.id}`, JSON.stringify(student));
  
  // Update index
  const allStudentsStr = localStorage.getItem(STORAGE_KEYS.ALL_STUDENTS);
  let allStudents: { id: string; name: string; class: string }[] = allStudentsStr ? JSON.parse(allStudentsStr) : [];
  
  if (!allStudents.find(s => s.id === student.id)) {
    allStudents.push({ id: student.id, name: student.name, class: student.class });
    localStorage.setItem(STORAGE_KEYS.ALL_STUDENTS, JSON.stringify(allStudents));
  }
};

export const getAllStudents = (): { id: string; name: string; class: string }[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ALL_STUDENTS);
  return data ? JSON.parse(data) : [];
};