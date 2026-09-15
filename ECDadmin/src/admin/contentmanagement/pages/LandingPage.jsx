import React from 'react'
import PageHeader from '../../components/PageHeader'
import { Button, TextField, Container, Grid, Typography, Card, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
function LandingPage() {
  return (
	<div className="p-6 bg-gray-50 min-h-screen">
				 <PageHeader
					title="Landing Page"
					breadcrumbs={[
					  { label: "Landing" },
					  { label: "Landing Page", active: true }
					]}
					/>

    <div className="min-h-screen bg-gray-50 font-sans">
            <section className="bg-[#b2f5ea] py-12 px-6 lg:px-20 flex flex-col md:flex-row items-center justify-between">
        <div className="max-w-xl">
          <Typography variant="h4" className="text-[#2d3748] font-bold mb-4">
            Find the best Food for you?
          </Typography>
          <div className="flex bg-white rounded-md shadow-sm">
            <TextField 
              fullWidth 
              placeholder="Search for your favorite food..." 
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
              }}
              sx={{ "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
            />
          </div>
        </div>
        <div className="mt-8 md:mt-0">
          <img src="/ban-rgt.png" alt="Delivery" className="w-98 h-auto" />
        </div>
      </section>

      <section className="py-16 px-6 lg:px-20 text-center">
        <Typography variant="h5" className="font-semibold text-gray-700 mb-2">At Work?</Typography>
        <Typography variant="body2" className="text-gray-500 mb-8">The easiest way to order the perfect meals at work</Typography>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row items-center border border-gray-100">
          <div className="p-10 text-left md:w-1/2">
            <Typography variant="h5" className="font-bold mb-4">What is Deliware?</Typography>
            <Typography className="text-gray-600 leading-relaxed">
              Deliware is an advanced script-based food delivery app that helps you build 
              your brand and fill your plates with online food orders. It is a feature-rich 
              solution for restaurant owners and entrepreneurs.
            </Typography>
          </div>
          <div className="md:w-1/2">
            <img src="b2b_dole.jpg" alt="Healthy Food" className="w-full object-cover" />
          </div>
        </div>
      </section>

<section className="relative w-full overflow-hidden bg-white py-20">
  <div className="container mx-auto px-6 lg:px-20 relative flex items-center min-h-[400px]">
    
    <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
      <div className="flex items-center gap-0 opacity-90 md:opacity-100">
        <img 
          src="pancakes.jpg" 
          alt="Food" 
          className="hidden md:block h- w-auto object-contain translate-x-12 z-0" 
        />
        <img 
          src="download.jpg" 
          alt="App Mockup" 
          className="h-94 w-auto object-contain drop-shadow-2xl z-10" 
        />
      </div>
    </div>

    {/* Content Layer (Overlapping the images) */}
    <div className="relative z-20 md:w-1/2">
      <Typography 
        variant="h3" 
        className="font-extrabold text-[#2d3748] mb-4 leading-tight drop-shadow-sm"
      >
        Honey, we're not <br /> cooking tonight
      </Typography>
      <Typography 
        variant="body1" 
        className="text-gray-600 max-w-sm font-medium leading-relaxed bg-white/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none p-4 md:p-0 rounded-lg"
      >
        On the high-end Deliware app, you can order from 
        various restaurants with hundreds of dishes in your local area. 
        Download and get what you want in a matter of clicks.
      </Typography>
    </div>

  </div>
</section>

      {/* 4. Bottom Grid Section */}
      <section className="py-16 px-6 lg:px-20 bg-gray-50">
        <Typography variant="h5" className="text-center font-bold mb-12">Hungry for more than food?</Typography>
        <div 
		 className="grid grid-cols-3">
          {/* Card 1 */}
          <Grid item xs={12} md={4}>
            <Box className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-100 h-full">
              <img src="bg11.jpg" alt="Chef" className="mx-auto mb-4 rounded" />
              <Typography variant="h6" className="font-bold mb-2">Become a Partner</Typography>
              <Button variant="outlined" color="primary" sx={{ mt: 2, borderRadius: '20px' }}>Apply Now</Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-100 h-full">
              <img src="bg12.jpg" alt="Rider" className="mx-auto mb-4 rounded" />
              <Typography variant="h6" className="font-bold mb-2">Ride with us</Typography>
              <Button variant="outlined" color="primary" sx={{ mt: 2, borderRadius: '20px' }}>Sign Up</Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-100 h-full">
              <img src="bg13.jpg" alt="Team" className="mx-auto mb-4 rounded" />
              <Typography variant="h6" className="font-bold mb-2">Our Team</Typography>
              <Button variant="outlined" color="primary" sx={{ mt: 2, borderRadius: '20px' }}>Join Us</Button>
            </Box>
          </Grid>
        </div>
      </section>

    </div>
</div>

				
  )
}

export default LandingPage