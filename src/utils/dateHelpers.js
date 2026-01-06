[cite_start]// [cite: 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
export const formatDateKey = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getMonday = (d) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

export const getInfiniteWeekWindow = (currentDate) => {
    const currentMonday = getMonday(currentDate);
    const startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - 7); 
    const days = [];
    for (let i = 0; i < 21; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }
    return days;
};

export const formatDateDisplay = (date) => date.getDate();

export const getDayName = (date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
};

export const getFullDateDisplay = (date) => {
    return `Thứ ${date.getDay() === 0 ? 'CN' : date.getDay() + 1}, ${date.getDate()}/${date.getMonth() + 1}`;
};

export const generateGoogleCalendarLink = (task) => {
    const startTime = task.date.replace(/-/g, '') + 'T090000';
    const endTime = task.date.replace(/-/g, '') + 'T100000';
    const details = encodeURIComponent(`${task.description || ''} \n\n[PlanFlow App]`);
    const title = encodeURIComponent(`DEADLINE: ${task.title}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`;
};