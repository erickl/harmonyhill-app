import { useState, useEffect } from 'react';
import * as todoService from "../services/todoService.js";
import * as userService from "../services/userService.js";
import * as bookingService from "../services/bookingService.js";
import * as activityService from "../services/activityService.js";
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ButtonsFooter from './ButtonsFooter.js';
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import TextInput from './TextInput.js';
import { useSuccessNotification } from "../context/SuccessContext.js";

export default function AddTodoScreen({ todoToEdit, onNavigate, onClose }) {
    const emptyForm = {
        title         : todoToEdit ? todoToEdit.title         : '',
        deadlineAt    : todoToEdit ? todoToEdit.deadlineAt    : '',
        //deadlineTime  : todoToEdit ? todoToEdit.deadlineTime  : '', // DatePicker not ready yet for custom time fields
        assignedTo    : todoToEdit ? todoToEdit.assignedTo    : '',
        duration      : todoToEdit ? todoToEdit.duration      : '',
        category      : todoToEdit ? todoToEdit.category      : '',
        activityId    : todoToEdit ? todoToEdit.activityId    : '',
        bookingId     : todoToEdit ? todoToEdit.bookingId     : '',
        description   : todoToEdit ? todoToEdit.description   : '',
        comments      : todoToEdit ? todoToEdit.comments      : '',
    };

    const [bookings,          setBookings         ] = useState([]       );
    const [activities,        setActivities       ] = useState([]       );
    const [teamMembers,       setTeamMembers      ] = useState([]       );
    const [readyToSubmit,     setReadyToSubmit    ] = useState(false    );
    const [validationError,   setValidationError  ] = useState(null     );
    const [formData,          setFormData         ] = useState(emptyForm);
    const [isAdmin,           setIsAdmin          ] = useState(false    );

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();

    const categories = {
        'Food'             : {"name" : "Food"             },
        'Laundry'          : {"name" : "Laundry"          },
        'Pool'             : {"name" : "Pool"             },
        'Utilities'        : {"name" : "Utilities"        },
        'Maintenance'      : {"name" : "Maintenance"      },
        'Tax & Accounting' : {"name" : "Tax & Accounting" },
        'Guest'            : {"name" : "Guest"            },
        'Other'            : {"name" : "Other"            },
    };

    const onValidationError = (error) => {
        setValidationError(error);
    };

    const getBookingActivities = async(bookingId) => {
        const bookingActivities = await activityService.get(bookingId);
            const activitiesByName = utils.groupBy(bookingActivities, (activity) => {
            return `${utils.to_YYMMdd(activity.startingAt)} ${activity.displayName}`
        });
        setActivities(activitiesByName);
    };

    const getBookings = async() => {
        const filter = {"after": utils.today(-30), "before" : utils.today(10)};
        const bookings = await bookingService.get(filter, onError);
        const bookingsByName = utils.groupBy(bookings, (booking) => {
            const house = booking.house === "harmony hill" ? "HH" : "JN";
            return `${utils.to_YYMMdd(booking.checkInAt)} ${house} ${booking.name}`
        });
        setBookings(bookingsByName);
    };

    useEffect(() => {
        // Initial validation
        validateFormData(emptyForm);

        const getUserPermissions = async() => {
            const userIsAdmin = await userService.isAdmin();
            setIsAdmin(userIsAdmin);
        } 

        const fetchTeamMembers = async () => {
            const teamMembers = await userService.getUsers();
            const formattedTeamMembers = teamMembers.reduce((m, teamMember) => {
                m[teamMember.name] = teamMember;
                return m;
            }, {})
            setTeamMembers(formattedTeamMembers);
        };

        getUserPermissions();
        fetchTeamMembers();
    }, []);

    
    const needsGuestInfo = (formDataCategory) => {
        const category = formDataCategory.trim().toLowerCase();
        return category === "guest";
    }

    const needsActivityInfo = (formDataCategory) => {
        const category = formDataCategory.trim().toLowerCase();
        return category === "guest";
    }

    // Fetch booking data only if needed and if it's not already fetched
    useEffect(() => {
        const guestInfoNeeded = needsGuestInfo(formData.category);
        const activityInfoNeeded = needsActivityInfo(formData.category);

        if(guestInfoNeeded && utils.isEmpty(bookings)) {
            getBookings();
        }
        if(activityInfoNeeded && utils.isEmpty(activities) && !utils.isEmpty(formData.bookingId)) {
            getBookingActivities(formData.bookingId);
        }

        if(!guestInfoNeeded) {
            handleChange("_batch", {
                "bookingId"  : null,
                "activityId" : null
            });
        }
    }, [formData.category]);

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        
        handleChange("_batch", {
            "assignedTo" : name,
        });
    }

    const onCategorySelect = (category) => {
        const name = category ? category.name : '';

        const change = {
            "category"    : name,
        }

        const guestInfoNeeded = needsGuestInfo(name);

        if(!guestInfoNeeded) {
            change["bookingId"] = null;
            change["activityId"] = null;
        }

        handleChange("_batch", change);
    }

    const onBookingSelect = async (booking) => {
        const id = booking ? booking[0].id : '';
        handleChange("_batch", {
            "bookingId"  : id,
            "activityId" : null
        });
        
        if(needsActivityInfo(formData.category)) {
            getBookingActivities(id);
        }
    }

    const onActivitySelect = (activity) => {
        const id = activity ? activity[0].id : '';
        handleChange("activityId", id);
    }

    const resetForm = () => {
        setFormData(emptyForm);
    };

    const validateFormData = async (newFormData) => {
        const validationResult = await todoService.validate(newFormData, onValidationError);

        setReadyToSubmit(validationResult);

        if(validationResult === true) {
            setValidationError(null);
        }
    }

    const handleChange = (field, value) => {
        let nextFormData = {};

        if (field === "_batch" && typeof value === 'object' && value !== null) {
            nextFormData = { ...formData, ...value };
        }
        else if (field === 'amount') {
            const numericValue = utils.cleanNumeric(value);
            nextFormData = { ...formData, [field]: numericValue };
        } else {
            nextFormData = { ...formData, [field]: value };
        }

        if(!utils.isEmpty(nextFormData)) {
            setFormData(nextFormData);
        }

        validateFormData(nextFormData);
    };

    const handleSubmit = async () => {
        try {
            if(!readyToSubmit) return onError(`Not yet ready to submit. Missing obligatory data`);
            
            let result = false;
            
            if(todoToEdit) {
                result = await todoService.update(todoToEdit.id, formData, onError);
            } else {
                result = await todoService.add(formData, onError);
            }         

            if(result !== false) {
                if(todoToEdit) onClose();
                else resetForm();
                onSuccess();
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Create New Todo</h2>
                </div>
            
                <div>
                    {!todoToEdit && (
                        <button className="add-button" onClick={() => onClose()}>
                            ☰
                        </button>
                    )}
                </div>
            </div>
            <div className="card-content">     
                <TextInput
                    type="text"
                    name="title"
                    label={"Title"}
                    value={formData.title}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                />

                <div className="purchase-form-group">
                    <Dropdown 
                        current={formData.assignedTo} 
                        label={"Assigned To"} 
                        options={teamMembers} 
                        onSelect={onTeamMemberSelect}
                    />
                </div>

                <div className="purchase-form-group">
                    <Dropdown 
                        label={"Category"} 
                        options={categories}
                        current={formData.category}
                        onSelect={onCategorySelect}
                    />
                </div>

                <MyDatePicker 
                    name={"deadlineAt"} 
                    label={"Deadline"}
                    date={formData.deadlineAt} 
                    onChange={handleChange}
                    time={null}
                    useTime={false}
                />

                {needsGuestInfo(formData.category) && (
                    <div className="purchase-form-group">
                        <Dropdown 
                            label={"Booking"} 
                            options={bookings}
                            current={formData.bookingId}
                            onSelect={onBookingSelect}
                        />
                    </div>
                )}

                {needsActivityInfo(formData.category) && !utils.isEmpty(formData.bookingId) && (
                    <div className="purchase-form-group">
                        <Dropdown 
                            label={"Activity"} 
                            options={activities}
                            current={formData.activityId}
                            onSelect={onActivitySelect}
                        />
                    </div>
                )}

                <TextInput
                    type="text"
                    name="description"
                    label={"Description"}
                    value={formData.description}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                />

                <TextInput
                    type="text"
                    name="comments"
                    label={"Comments"}
                    value={formData.comments}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                />

                {(validationError && <p className="validation-error">{validationError}</p>)}

                <ButtonsFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    submitEnabled={readyToSubmit}
                />
            </div>
        </div>
    );
};
