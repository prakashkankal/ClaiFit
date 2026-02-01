
/**
 * Calculates the profile completion percentage for a tailor.
 * @param {Object} tailor - The tailor user object.
 * @returns {Object} - { percentage: number, missingFields: string[] }
 */
export const calculateProfileCompletion = (tailor) => {
    if (!tailor) return { percentage: 0, missingFields: [] };

    const requiredFields = [
        { key: 'shopName', label: 'Shop Name' },
        { key: 'shopImage', label: 'Shop Image/Logo' },
        { key: 'bio', label: 'About/Bio' },
        { key: 'experience', label: 'Years of Experience' },
        { key: 'specialization', label: 'Specialization' },
        { key: 'phone', label: 'Phone Number' },
    ];

    // Address fields often come nested
    const requiredAddressFields = [
        { key: 'street', label: 'Street Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'pincode', label: 'Pincode' }
    ];

    let completedCount = 0;
    const missingFields = [];
    const totalFields = requiredFields.length + 1; // +1 for the entire Address block

    // Check top-level fields
    requiredFields.forEach(field => {
        if (tailor[field.key] && tailor[field.key].toString().trim() !== '') {
            completedCount++;
        } else {
            missingFields.push(field.label);
        }
    });

    // Check Address (Treat as one big unit or detailed?)
    // Let's treat Address as one unit for the "Count" 
    // but list specific missing address parts if needed.
    // Actually, distinct fields are better for guidance.

    // Revised Strategy: Count every sub-field for accurate percentage.
    // Total = requiredFields + requiredAddressFields

    let addressCompletedCount = 0;
    let isAddressMissing = false;

    if (tailor.address) {
        requiredAddressFields.forEach(field => {
            if (tailor.address[field.key] && tailor.address[field.key].toString().trim() !== '') {
                addressCompletedCount++;
            } else {
                isAddressMissing = true;
            }
        });
    } else {
        isAddressMissing = true;
    }

    if (isAddressMissing) {
        missingFields.push('Complete Address');
    } else {
        // If all address fields are present, we count it as completed
        // This is a bit simplistic logic: if any address field is missing, we ask for "Complete Address"
        // To balance weight: Let's say top level fields are 1 point each. Address block is 1 point.
    }

    // Let's strictly count fields for percentage
    const totalPoints = requiredFields.length + requiredAddressFields.length;
    let earnedPoints = completedCount + addressCompletedCount;

    const percentage = Math.round((earnedPoints / totalPoints) * 100);

    return {
        percentage,
        missingFields
    };
};
