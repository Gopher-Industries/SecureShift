import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'

import TextInput from '../input/TextInput'
import AppIcon from '../images/app_icon.png'
import ABC_COMPANY_ICON from '../images/ABC_company_icon.png'
import ImageUpload from '../input/ImageUpload'
import ChipsGroup from '../input/ChipsGroup'

export default function CompanyProfile() {
    const [enableEdit, setEnableEdit] = useState(false)

    // Yup validation schema
    const validationSchema = Yup.object().shape({
        companyName: Yup.string().required('Company name is required'),
        ABNorACN: Yup.string().nullable(),
        primaryContact: Yup.string().required('Primary contact is required'),
        tel: Yup.string()
            .matches(/^\d+$/, 'Telephone must be numeric')
            .required('Telephone is required'),
        desc: Yup.string().max(300, 'Description must be at most 300 characters'),
        address: Yup.string().required('Address is required'),
        state: Yup.array().required('State is required'),
        sectorServed: Yup.array().required('Sector is required'),
    })

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            companyName: 'ABC Security',
            ABNorACN: '18006027326',
            primaryContact: 'John Smith',
            tel: '0400 000 000',
            desc: 'ABC Security has been a leader in retail security since 1990.  We work with retailers or facility management, to tailor what we offer, to better meet the needs of the client.',
            logo: ABC_COMPANY_ICON,
            address: `999 Main Rd\nMelbourne 3000 VIC`,
            state: ['NSW', 'QLD'],
            sectorServed: ['Retail'],
        },
    })

    const onSubmit = (data) => {
        console.log('Validated form data:', data)
        setEnableEdit(false)
    }

    const formField = [
        { name: 'companyName', label: 'Company Name', slot: 'left' },
        { name: 'ABNorACN', label: 'ABN or ACN', slot: 'left' },
        { name: 'primaryContact', label: 'Primary Contact', slot: 'left' },
        { name: 'tel', label: 'Telephone', slot: 'left' },
        { name: 'desc', label: 'Description', slot: 'left', multiline: true },
        { name: 'logo', label: 'Logo', slot: 'right' },
        { name: 'address', label: 'Address', slot: 'right', multiline: true },
        { name: 'state', label: 'States/Territories Served', slot: 'right' },
        { name: 'sectorServed', label: 'Sector Served', slot: 'right' },
    ]

    const STATES = ["NSW", "QLD", "SA", "ACT", "VIC", "WA", "TAS", "NT"]
    const SECTORS = ["Retail", "Corporate", "Events", "Hospitality", "Mobile Patrol", "Finance", "CCTV", "Construction"]

    return (
        <div style={{ padding: '20px' }}>
            <PageHeader companyName={'ABC Security'} />

            <form onSubmit={handleSubmit(onSubmit)}>
                <div
                    style={{
                        display: 'flex',
                        gap: '50px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        marginTop: '20px',
                    }}
                >
                    {/* LEFT SIDE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {formField
                            .filter((field) => field.slot === 'left')
                            .map((field, index) => (
                                <div
                                    key={index}
                                    style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                                >
                                    <div style={{ width: '150px', fontWeight: 'bold' }}>
                                        {field.label}:
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <TextInput
                                            {...register(field.name)}
                                            disabled={!enableEdit}
                                            multiline={field.multiline}
                                        />
                                        {errors[field.name] && (
                                            <p style={{ color: 'red', fontSize: '12px' }}>
                                                {errors[field.name].message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* RIGHT SIDE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {formField
                            .filter((field) => field.slot === 'right')
                            .map((field, index) => (
                                <div
                                    key={index}
                                    style={{ display: 'flex', gap: '10px', alignItems: 'start' }}
                                >
                                    <div style={{ width: '150px', fontWeight: 'bold' }}>
                                        {field.label}:
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {field.name === "state" ? (
                                            <ChipsGroup
                                                value={watch("state") || []}
                                                optionsList={STATES}
                                                onChange={(val) => setValue("state", val)}
                                                disabled={!enableEdit}
                                                chipWidth={58}
                                                maxChipsPerRow={4}
                                            />
                                        ) : field.name === "sectorServed" ? (
                                            <ChipsGroup
                                                value={watch("sectorServed") || []}
                                                optionsList={SECTORS}
                                                onChange={(val) => setValue("sectorServed", val)}
                                                disabled={!enableEdit}
                                                chipWidth={139}
                                                maxChipsPerRow={2}
                                            />
                                        ) :
                                            field.name === "logo" ? (
                                                <ImageUpload
                                                    value={watch("logo")}
                                                    onChange={(val) => setValue("logo", val)}
                                                    disabled={!enableEdit}

                                                />
                                            ) : (
                                                <TextInput
                                                    {...register(field.name)}
                                                    disabled={!enableEdit}
                                                    multiline={field.multiline}
                                                />
                                            )}

                                        {errors[field.name] && (
                                            <p style={{ color: 'red', fontSize: '12px' }}>
                                                {errors[field.name].message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                <ButtonGroup
                    editProfileOnClick={() => setEnableEdit((prev) => !prev)}
                    manageListingsOnClick={() => console.log('Manage Listings')}
                    manageRatingsOnClick={() => console.log('Manage Ratings')}
                    enableEdit={enableEdit}
                />
            </form>
        </div>
    )
}

function PageHeader({ companyName }) {
    const headerStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    }

    const companyNameStyles = {
        fontSize: '38px',
        fontWeight: 'bold',
    }

    const titleStyles = {
        marginTop: '16px',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '50px',
    }

    return (
        <>
            <div style={headerStyles}>
                <img src={AppIcon} alt="app_icon" style={{ width: '80px' }} />
                <div style={companyNameStyles}>{companyName}</div>
                <img src={ABC_COMPANY_ICON} alt="abc_company_icon" style={{ width: '80px' }} />
            </div>
            <div style={titleStyles}>Company Profile</div>
        </>
    )
}

function ButtonGroup({ editProfileOnClick, manageListingsOnClick, manageRatingsOnClick, enableEdit }) {
    const buttonGroupStyles = {
        marginTop: '30px',
        display: 'flex',
        justifyContent: 'center',
        gap: '100px',
        cursor: 'pointer',
    }

    const buttonStyle = {
        minWidth: '120px',
        textAlign: 'center',
        borderRadius: '110px',
        backgroundColor: '#284B93',
        color: 'white',
        fontWeight: 'bold',
        padding: '50px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    }

    return (
        <div style={buttonGroupStyles}>
            <div onClick={editProfileOnClick} style={buttonStyle}>
                {enableEdit ? "Finish Editing" : "Edit Profile"}
            </div>
            <div onClick={manageListingsOnClick} style={buttonStyle}>
                Manage Listings
            </div>
            <div onClick={manageRatingsOnClick} style={buttonStyle}>
                Manage Ratings
            </div>
        </div>
    )
}
