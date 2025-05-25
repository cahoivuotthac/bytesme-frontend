import React, { useState } from 'react'
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface DatePickerModalProps {
    visible: boolean
    onClose: () => void
    onSelect: (date: Date) => void
    currentDate: Date
    minDate?: Date
    maxDate?: Date
    locale: string
}

export default function DatePickerModal({
    visible,
    onClose,
    onSelect,
    currentDate,
    minDate,
    maxDate,
    locale
}: DatePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState(currentDate)
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

    const monthNames = Array.from({ length: 12 }, (_, i) => {
        return new Date(2000, i).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', { month: 'long' })
    })

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const isDateSelectable = (date: Date) => {
        if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return false
        if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return false
        return true
    }

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
        const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()
        const days = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />)
        }

        // Add day cells
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(selectedYear, selectedMonth, i)
            const isSelected = date.toDateString() === selectedDate.toDateString()
            const isSelectable = isDateSelectable(date)

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDay,
                        !isSelectable && styles.disabledDay,
                    ]}
                    onPress={() => {
                        if (isSelectable) {
                            setSelectedDate(date)
                        }
                    }}
                    disabled={!isSelectable}
                >
                    <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        !isSelectable && styles.disabledDayText,
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            )
        }

        return days
    }

    const handleConfirm = () => {
        onSelect(selectedDate)
        onClose()
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#2F2D2C" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Select Date</Text>
                        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                            <Text style={styles.confirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.monthYearSelector}>
                        <TouchableOpacity
                            onPress={() => {
                                if (selectedMonth === 0) {
                                    setSelectedMonth(11)
                                    setSelectedYear(selectedYear - 1)
                                } else {
                                    setSelectedMonth(selectedMonth - 1)
                                }
                            }}
                        >
                            <Ionicons name="chevron-back" size={24} color="#2F2D2C" />
                        </TouchableOpacity>
                        <Text style={styles.monthYearText}>
                            {monthNames[selectedMonth]} {selectedYear}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                if (selectedMonth === 11) {
                                    setSelectedMonth(0)
                                    setSelectedYear(selectedYear + 1)
                                } else {
                                    setSelectedMonth(selectedMonth + 1)
                                }
                            }}
                        >
                            <Ionicons name="chevron-forward" size={24} color="#2F2D2C" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekDayHeader}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <Text key={day} style={styles.weekDayText}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.calendar}>
                        {renderCalendar()}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: '#2F2D2C',
    },
    confirmButton: {
        padding: 8,
    },
    confirmText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#C67C4E',
    },
    monthYearSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    monthYearText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#2F2D2C',
    },
    weekDayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayText: {
        width: 40,
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#9B9B9B',
    },
    calendar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    dayText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#2F2D2C',
    },
    selectedDay: {
        backgroundColor: '#C67C4E',
        borderRadius: 20,
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontFamily: 'Inter-SemiBold',
    },
    disabledDay: {
        opacity: 0.5,
    },
    disabledDayText: {
        color: '#9B9B9B',
    },
})