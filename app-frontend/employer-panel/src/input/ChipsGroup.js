import lockIcon from '../images/icon_lock.svg';

export default function ChipsGroup({ value = [], onChange, disabled, chipWidth = 58, maxChipsPerRow = 4, optionsList }) {
    const gap = 20 // 

    const rows = []
    for (let i = 0; i < optionsList.length; i += maxChipsPerRow) {
        rows.push(optionsList.slice(i, i + maxChipsPerRow))
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, position: 'relative' }}>
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} style={{ display: 'flex', gap: `${gap}px` }}>
                    {row.map((item) => {
                        const selected = value.includes(item)
                        return (
                            <div
                                key={item}
                                onClick={() => {
                                    if (disabled) return
                                    if (selected) {
                                        onChange(value.filter((s) => s !== item))
                                    } else {
                                        onChange([...value, item])
                                    }
                                }}
                                style={{
                                    padding: '10px 0',
                                    width: `${chipWidth}px`,
                                    textAlign: 'center',
                                    borderRadius: '20px',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    backgroundColor: selected ? '#ABABAB' : '#0C2261',
                                    color: 'white',
                                    userSelect: 'none',
                                }}
                            >
                                {item}
                            </div>
                        )
                    })}
                </div>
            ))}

            <img src={lockIcon} alt="lock_icon" style={{ position: 'absolute', right: '10px', bottom: '10px', visibility: disabled ? 'visible' : 'hidden' }} />
        </div>
    )
}
