
const canvas = document.getElementById('my_chart');

let chart = new Chart(canvas, {
    type: 'line',
    data: {
        labels:  new Array(10).fill(100),
        datasets: [{
            label: 'frame_time',
            data: new Array(10).fill(1)
        }]
    }
});


const backend_output = document.getElementById('backend_output');
const info_output = document.getElementById('info_output');

const file_input = document.getElementById('file_input');
file_input.addEventListener('input', () => {
    const file = file_input.files[0];
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = update_chart;
    console.log(file.files);
});


let chart_data;


function extract_data(file_content) {
    /**
     * @type {string[]}
     */
    const lines = file_content.split('\n');
    console.log(lines);
    let start_index = 0;

    if(lines[0].startsWith('log-version')) {
        console.log(`version: ${lines[0].split(' ')[0]}`);
        start_index = 1;
    }
    else {
        console.log('no version specified');
    }

    const result = {
        backend: '',
        info: '',
        frames: []
    }

    for(let i = start_index; i < lines.length; i++) {
        const parts = lines[i].split(': ');
        
        const time = Date.parse(parts[0]);

        if(parts[1].startsWith('Frame')) {
            result.frames.push({
                timestamp: time,
                frame_no: parseInt(parts[1].split(' ')[1]),
                frame_time: parseInt(parts[2].slice(0, -2))
            });
        }
        else if(parts[1].startsWith('using backend')) {
            result.backend = parts[2];
        }
        else if(parts[1].startsWith('renderer info')) {
            console.log(parts);
            result.info = parts.slice(2).join(': ');
        }
    }

    return result;
}

function update_chart(evt) {
    chart_data = extract_data(evt.target.result);

    backend_output.innerText = `Backend: ${chart_data.backend}`;
    info_output.innerText = `Renderer Info: ${chart_data.info}`;

    let start = 1;
    let number_frames = 200;

    const data = chart_data;
    data.frames = chart_data.frames.filter((value, i) => { 
        if(i >= start && i < start + number_frames) {
            return value;
        }
    });
    console.log(data);

    chart.data.labels = data.frames.map((value, i) => { return `Frame ${value.frame_no}`});
    chart.data.datasets[0].data = data.frames.map((value, i) => { return value.frame_time});
    console.log(chart.data);
    chart.options.scales['y'].min = 0;
    chart.options.scales['y'].max = 200;
    chart.update();
}