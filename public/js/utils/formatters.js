/**
 * @fileoverview Módulo de utilitários para formatação de dados.
 * Contém funções para formatar valores monetários e datas.
 * @author Breno Goulart
 */

/**
 * Formata um número como moeda brasileira (BRL).
 * @param {number} value - O valor numérico a ser formatado.
 * @returns {string} O valor formatado como string de moeda.
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Formata um objeto Date ou string de data para o formato 'DD/MM/YYYY'.
 * @param {Date|string} dateInput - A data a ser formatada. Pode ser um objeto Date ou uma string.
 * @returns {string} A data formatada como string.
 */
export function formatDate(dateInput) {
    let date;
    if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        return ''; // Retorna vazio ou lança um erro se o input não for válido
    }

    if (isNaN(date.getTime())) {
        return ''; // Retorna vazio se a data for inválida
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
